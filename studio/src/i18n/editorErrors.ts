import { isKnownMessage } from './messages';
import type { Translate } from './I18n';
import { getStudioSaveStatusCode } from '../utils/studioSaveDiagnostics';

export function historyFailureMessage(message: string, t: Translate): string {
  if (isKnownMessage(message)) return t(message);
  if (/conflict|changed|version mismatch/i.test(message)) return t('The project changed. Refresh the editor before trying again.');
  if (/network|fetch|connect/i.test(message)) return t('Cannot connect to the preview service. Check the connection and retry.');
  return t('The operation could not be completed. Check the project and retry.');
}

export function splitFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  // Do not claim the source is unchanged when a rollback or refresh failed.
  if (/rollback conflicts|could not be safely restored/.test(message)) return 'The split could not be rolled back safely. Reload and check the project before editing again.';
  if (message.startsWith('Cut conflict:')) return 'The project changed during splitting. Refresh the editor and retry.';
  if (message.startsWith('Failed to read ') || message.startsWith('Missing content version for ')) return 'Cannot read the latest clip source. Refresh the editor and retry.';
  if (message === 'Clip is missing a patchable target.') return 'This clip cannot be split. Select a different clip.';
  if (isKnownMessage(message)) return message;
  return 'Could not split the clip. Check the current clip and retry.';
}

export function compositionInsertionFailureMessage(error: unknown): string {
  const status = getStudioSaveStatusCode(error);
  if (status === 409) return 'The project changed. Refresh the editor before trying again.';
  if (status === 400 && error instanceof Error) {
    if (error.message.includes('Composition insertion would create a cycle')) {
      return 'Adding this composition would create a circular reference. Choose a different composition.';
    }
    if (error.message.includes('Composition source has no valid data-composition-duration')) {
      return 'Set a valid duration on the composition before adding it to the timeline.';
    }
  }
  return 'The operation could not be completed. Check the project and retry.';
}
