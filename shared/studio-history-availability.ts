import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';
import type { ProjectHistory } from '@hyperframes/studio-server';

/** Filter the offered steps; native undo/redo still validates files immediately before writing. */
export function withAvailableHistorySteps(history: ProjectHistory, historyRoot: string): ProjectHistory {
  const home = path.join(historyRoot, history.projectId);
  // shortcut: the pinned 0.9.7 API has no blob-existence probe; replace this when upstream exposes one.
  const readable = (hash: string) => /^[a-f0-9]{64}$/.test(hash) && ['blobs', 'aside'].some(directory => {
    try {
      const file = path.join(home, directory, hash.slice(0, 2), hash);
      accessSync(file, constants.R_OK);
      return statSync(file).isFile();
    } catch { return false; }
  });
  return {
    ...history,
    next(direction, who) {
      const entry = history.next(direction, who);
      if (!entry) return undefined;
      const entries = history.list();
      const current: Record<string, string | null> = history.peek(entries.at(-1)?.id ?? 'start') ?? {};
      // A pending step is not in the log yet, but its after hashes describe the observed files.
      if (!entries.some(saved => saved.id === entry.id)) {
        for (const file of entry.files) current[file.path] = file.after;
      }
      if (entry.files.some(file => (current[file.path] ?? null) !== file.after)) return undefined;
      const deletedFirst = new Set(entry.files.filter(file => file.before === null).map(file => file.after));
      // Native history moves deleted media into aside before restoring another path with those bytes.
      return entry.files.every(file => file.before === null || deletedFirst.has(file.before) || readable(file.before))
        ? entry : undefined;
    },
  };
}
