/** Only recognized causes reach the feedback; never echo file paths or server output. */
export function saveFailureFeedback(statusCode: number | null, diagnostic: string): string {
  if (statusCode === 409) return "The project changed elsewhere. Changes were not saved.";
  if (statusCode === 401 || statusCode === 403 || /EACCES|EPERM|permission denied|access denied/i.test(diagnostic)) {
    return "No permission to save changes.";
  }
  if (/failed to fetch|network\s?error|fetch failed|ECONNREFUSED|connection.*(?:lost|refused|failed)/i.test(diagnostic)) {
    return "Connection lost. Changes were not saved.";
  }
  return "Changes were not saved. Saving is paused.";
}
