import path from 'node:path';
import { lstat, readFile, mkdir } from 'node:fs/promises';
import { atomicJson, jsonFile, fileHash } from './phase1-versions.ts';
import { createHash } from 'node:crypto';
import type { WorkspaceStore } from './workspace.ts';
import { execute } from './hyperframes.ts';
import { verificationBinaries } from './scripts/verify-export.ts';

const maxInlineVideoBytes = 32 * 1024 * 1024;
function verified(value: unknown): { sha256: string } | null {
  if (!value || typeof value !== 'object') return null;
  const report = value as Record<string, unknown>;
  return report.status === 'passed' && typeof report.sha256 === 'string' && /^[a-f0-9]{64}$/.test(report.sha256)
    ? { sha256: report.sha256 } : null;
}
export type WorkRound = {
  id: string; projectId: string; title: string; mode: 'create' | 'modify';
  createdAt: number; updatedAt: number; versionId: string; versionNumber: number; revision: string;
  state: 'authoring' | 'saved' | 'failed'; error?: string; jobId?: string; previousJobId?: string;
};

/** Work identity is separate from the native content version and export identity. */
export class WorkRounds {
  readonly store: WorkspaceStore;
  constructor(store: WorkspaceStore) { this.store = store; }
  file(id: string) {
    if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) throw new Error('INVALID_WORK_ID');
    return path.join(this.store.directory, 'phase1', 'work', id + '.json');
  }
  async create(project: any, mode: WorkRound['mode']) {
    const round: WorkRound = { id: crypto.randomUUID(), projectId: project.projectId,
      title: this.store.projectCatalog().projects.find(item => item.id === project.projectId)!.title,
      mode, createdAt: Date.now(), updatedAt: Date.now(), versionId: project.currentVersionId,
      versionNumber: project.currentVersionNumber, revision: project.revision, state: 'authoring',
      previousJobId: project.exports.find((job: any) => job.state === 'completed' && verified(job.verification))?.id };
    await atomicJson(this.file(round.id), round);
    return this.read(project.projectId, round.id);
  }
  async get(projectId: string, id: string) {
    const work = await jsonFile<WorkRound | null>(this.file(id), null);
    if (!work || work.projectId !== projectId) throw new Error('WORK_NOT_FOUND: 本轮工作不属于该工程');
    return work;
  }
  async writable(name: string, args: any) {
    const work = await this.get(args.projectId, args.workId);
    if (work.jobId || work.state === 'failed') throw new Error('WORK_CLOSED: 请为新一轮制作建立新的视频框');
    if (name === 'motion_export_request' && (args.action === 'record_review' || args.versionId !== work.versionId || args.expectedRevision !== work.revision))
      throw new Error('WORK_VERSION_MISMATCH: 只可播放本轮实际保存的版本');
  }
  async observed(name: string, args: any, result: any) {
    const work = await this.get(args.projectId, args.workId);
    if (name === 'motion_edit_project') {
      if (result.version.versionNumber < work.versionNumber) return;
      if (work.jobId) {
        if (work.versionId === result.version.versionId && work.revision === result.revision) return;
        throw new Error('WORK_CLOSED: 已提交轮次不能重新绑定内容');
      }
      if (work.state !== 'failed') work.state = 'saved';
      work.versionId = result.version.versionId;
      work.versionNumber = result.version.versionNumber; work.revision = result.revision;
    } else if (name === 'motion_export_request') {
      if (result.job.versionId !== work.versionId || result.job.revision !== work.revision || work.jobId && work.jobId !== result.job.id)
        throw new Error('WORK_VERSION_MISMATCH: 渲染记录不属于本轮固定版本');
      if (work.jobId === result.job.id) return;
      work.jobId = result.job.id;
    }
    work.updatedAt = Date.now(); await atomicJson(this.file(work.id), work);
  }
  async failed(projectId: string, id: string, error: string) {
    const work = await this.get(projectId, id);
    if (work.jobId) return; // A lost reply does not undo an actually queued render.
    work.state = 'failed'; work.error = error; work.updatedAt = Date.now();
    await atomicJson(this.file(id), work);
  }
  async read(projectId: string, id: string) {
    const work = await this.get(projectId, id);
    let state: string = work.state, error = work.error, updatedAt = work.updatedAt, playable = false, videoBytes: number | undefined, sha256: string | undefined;
    if (work.jobId) {
      const job = (await this.store.forProject(projectId).status(work.jobId)).exportJob;
      if (!job || job.versionId !== work.versionId || job.revision !== work.revision) { state = 'failed'; error = '本轮关联的渲染任务不可用'; }
      else {
        state = job.state === 'pending' ? 'queued' : job.state === 'running' ? job.stage ?? 'rendering' : job.state;
        error = job.error;
        updatedAt = (await lstat(path.join(this.store.directory, 'jobs', job.id, 'job.json'))).mtimeMs;
        if (job.state === 'completed') {
          try {
            const file = await lstat(await this.videoFile(job.id)); videoBytes = file.size;
            if (!file.isFile() || file.isSymbolicLink() || !file.size) throw new Error('视频文件不可用');
            const verification = verified(job.verification);
            if (!verification) throw new Error('视频尚无通过的技术校验');
            if (file.size > maxInlineVideoBytes) throw new Error('视频超过 32 MiB 内嵌上限，请使用导出文件');
            sha256 = verification.sha256;
            if (!sha256 || await fileHash(await this.videoFile(job.id)) !== sha256) throw new Error('视频文件与已校验版本不一致');
            playable = true;
          } catch (reason) { state = 'unavailable'; error = (reason as Error).message; }
        }
      }
    } else if (state !== 'failed' && Date.now() - work.updatedAt > 120_000) state = 'unconfirmed';
    return { ...work, state, error, updatedAt, playable, videoBytes, sha256 };
  }
  async videoFile(jobId: string) {
    if (!/^[a-f0-9-]{36}$/.test(jobId)) throw new Error('INVALID_JOB_ID');
    const job = await this.store.job(jobId);
    if (!job) throw new Error('EXPORT_NOT_FOUND');
    const file = this.store.exportPath(job);
    const relative = path.relative(path.join(this.store.directory, 'exports'), file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('INVALID_EXPORT_PATH');
    return file;
  }
  async media(projectId: string, id: string) {
    const view = await this.read(projectId, id), media: { video?: string; poster?: string } = {};
    const posterId = view.playable ? view.jobId : view.previousJobId;
    if (posterId) {
      const job = (await this.store.forProject(projectId).status(posterId)).exportJob;
      if (job?.projectId === projectId && job.state === 'completed' && verified(job.verification)) {
        try {
          const source = await lstat(await this.videoFile(posterId));
          if (!source.isFile() || source.isSymbolicLink()) throw new Error('媒体不可用');
          if (await fileHash(await this.videoFile(posterId)) !== verified(job.verification)!.sha256) throw new Error('封面来源已变化');
          const file = path.join(this.store.directory, 'phase1', 'inline-posters', posterId + '.jpg');
          if (!(await lstat(file).catch(() => null))) {
            await mkdir(path.dirname(file), { recursive: true });
            const result = await execute(verificationBinaries().ffmpeg, ['-v', 'error', '-y', '-i', await this.videoFile(posterId), '-frames:v', '1', '-vf', 'scale=min(960\\,iw):-2', file], this.store.directory, 10_000);
            if (result.code) throw new Error('封面不可用');
          }
          const poster = await lstat(file);
          if (poster.isFile() && !poster.isSymbolicLink() && poster.size <= 2 * 1024 * 1024)
            media.poster = 'data:image/jpeg;base64,' + (await readFile(file)).toString('base64');
        } catch { /* A missing optional cover never reports the film as ready. */ }
      }
    }
    if (view.playable) {
      const file = await lstat(await this.videoFile(view.jobId!));
      if (!file.isFile() || file.isSymbolicLink() || file.size > maxInlineVideoBytes) throw new Error('INLINE_MEDIA_UNAVAILABLE');
      const bytes = await readFile(await this.videoFile(view.jobId!));
      if (createHash('sha256').update(bytes).digest('hex') !== view.sha256) throw new Error('INLINE_MEDIA_CHANGED');
      media.video = 'data:video/mp4;base64,' + bytes.toString('base64');
    }
    return media;
  }
}
