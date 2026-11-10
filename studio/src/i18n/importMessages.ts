import type { Translate } from './I18n';

// Keep diagnostics in the response/log; only actionable copy reaches the user.
export function importValidationMessage(reason: string, t: Translate): string {
  if (reason === 'no supported video stream found') return t('No playable video found. Export a video file and try again.');
  if (reason === 'no supported audio stream found') return t('No playable audio found. Export an audio file and try again.');
  if (reason === 'ffprobe failed to read the media file') return t('Cannot read this media file. Check that it is complete or export it again.');
  if (reason === 'ffprobe returned unreadable media metadata') return t('Cannot read the media information. Export the file again and retry.');
  if (reason.startsWith('HYPERFRAMES_FFPROBE_PATH names ')) return t('The media checker cannot start. Check the local media-tool configuration and retry.');
  if (reason.startsWith('not checked: ffprobe was not found.')) return t('Media checking is unavailable. The file was added, but playback has not been verified.');
  return t('Could not validate this media file. Check the file and retry.');
}
