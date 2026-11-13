import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, open, rename, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { applyChanges, validateTokens } from '../token-model.js';
import { renderDesignTokens } from '../generate.js';

export class SourceError extends Error {
  constructor(status, message, details = {}) { super(message); this.status = status; this.details = details; }
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

/** Only package-owned token sources and their generated outputs are writable. */
export class DesignSource {
  constructor(directory) { this.directory = directory; this.pending = Promise.resolve(); }
  async ordinaryFile(relative) {
    let current = this.directory;
    for (const part of relative.split('/')) {
      current = path.join(current, part);
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) throw new SourceError(400, '设计系统文件不能通过符号链接指向其他位置。');
    }
    if (!(await lstat(current)).isFile()) throw new SourceError(400, '设计系统源文件无效。');
    return current;
  }
  async read() {
    const bytes = await readFile(await this.ordinaryFile('tokens.json'));
    let tokens;
    try { tokens = validateTokens(JSON.parse(bytes.toString())); }
    catch (error) { throw new SourceError(422, `源码暂时无法读取：${error.message}`); }
    return { revision: digest(bytes), tokens, bytes };
  }
  async locked(task) {
    const run = this.pending.then(async () => {
      const lockPath = path.join(this.directory, '.workbench.lock');
      let handle;
      try { handle = await open(lockPath, 'wx', 0o600); }
      catch (error) {
        if (error.code === 'EEXIST') throw new SourceError(423, '另一个设计系统进程正在保存，请稍后再试。');
        throw error;
      }
      try { await handle.writeFile(JSON.stringify({ pid: process.pid })); return await task(); }
      finally { await handle.close(); await rm(lockPath, { force: true }); }
    });
    this.pending = run.catch(() => {});
    return run;
  }
  async writeOutputs(snapshot, next, includeSource) {
    const outputs = renderDesignTokens(next);
    if (includeSource) outputs['tokens.json'] = JSON.stringify(next, null, 2) + '\n';
    const staged = [], committed = [];
    try {
      for (const [relative, text] of Object.entries(outputs)) {
        const file = await this.ordinaryFile(relative);
        const before = await readFile(file);
        const bytes = Buffer.from(text);
        if (before.equals(bytes)) continue;
        const temp = path.join(path.dirname(file), `.workbench-${randomUUID()}.tmp`);
        await writeFile(temp, bytes, { flag: 'wx', mode: 0o644 });
        staged.push({ file, temp, before, bytes });
      }
      // Re-read immediately before committing; arbitrary editors do not share our advisory lock.
      if ((await this.read()).revision !== snapshot.revision) throw new SourceError(409, '源码已被其他编辑者修改。请同步最新版本后再保存。');
      for (const entry of staged) { await rename(entry.temp, entry.file); committed.push(entry); }
    } catch (error) {
      // Restore only files still containing our bytes, never another editor's later contents.
      for (const entry of committed.reverse()) {
        if ((await readFile(entry.file)).equals(entry.bytes)) await writeFile(entry.file, entry.before);
      }
      throw error;
    } finally {
      await Promise.all(staged.map(entry => rm(entry.temp, { force: true })));
    }
  }
  async snapshot() {
    const source = await this.read();
    // An Agent edits the same source. Repair derived outputs without rewriting its JSON.
    const outputs = renderDesignTokens(source.tokens);
    const stale = (await Promise.all(Object.entries(outputs).map(async ([file, text]) =>
      (await readFile(await this.ordinaryFile(file), 'utf8')) !== text))).some(Boolean);
    if (stale) await this.locked(async () => {
      const fresh = await this.read();
      await this.writeOutputs(fresh, fresh.tokens, false);
    });
    const fresh = stale ? await this.read() : source;
    return { revision: fresh.revision, tokens: fresh.tokens };
  }
  async save(expectedRevision, changes) {
    if (!/^[a-f0-9]{64}$/.test(expectedRevision ?? '')) throw new SourceError(400, '保存需要当前源码版本。');
    return this.locked(async () => {
      const current = await this.read();
      if (current.revision !== expectedRevision) throw new SourceError(409, '源码已有更新，你的草稿已保留。', { latest: { revision: current.revision, tokens: current.tokens } });
      let next;
      try { next = applyChanges(current.tokens, changes); }
      catch (error) { throw new SourceError(400, error.message); }
      await this.writeOutputs(current, next, true);
      const saved = await this.read();
      return { revision: saved.revision, tokens: saved.tokens, files: ['tokens.json', ...Object.keys(renderDesignTokens(next))] };
    });
  }
}
