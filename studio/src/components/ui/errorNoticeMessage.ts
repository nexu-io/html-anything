import { isKnownMessage, sourceMessage } from '../../i18n/messages';

export type ErrorContext = 'operation' | 'export';

/** Raw diagnostics stay in details; only recognized causes reach the summary. */
export function errorNoticeMessage(message: string, context: ErrorContext = 'operation'): string {
  if (/external change|changed elsewhere|revision.*(?:changed|mismatch)|version mismatch|conflict|项目已切换|工程状态.*不匹配/i.test(message)) {
    return 'The project changed elsewhere. Resolve the changes before continuing.';
  }
  if (/couldn.t save|could not save|failed to save|auto-save is paused|unsaved edit|无法保存|保存失败/i.test(message)) {
    return 'Changes could not be saved. Check the connection and project before continuing.';
  }
  if (/ENOENT|no such file|file not found|文件.*(?:丢失|不存在)|找不到.*文件/i.test(message)) {
    return 'A required file is missing. Check or replace it, then try again.';
  }
  if (/EACCES|EPERM|permission denied|access denied|权限不足|拒绝访问/i.test(message)) {
    return 'Access to the file was denied. Check its permissions.';
  }
  if (/unsupported.*(?:format|codec)|(?:format|codec).*not supported|不支持.*格式/i.test(message)) {
    return 'This file format is not supported.';
  }
  if (context !== 'export' && /failed to fetch|network error|networkerror|fetch failed|ECONNREFUSED|connection.*(?:lost|refused|failed)|连接.*(?:失败|中断)/i.test(message)) {
    return 'Cannot connect to the local studio. Check that it is running.';
  }
  if (context === 'export' && /media|decode|invalid data|读取.*(?:素材|媒体)|素材.*损坏/i.test(message)) {
    return 'Media could not be read. Check or replace it before exporting again.';
  }
  // Preserve short, authored product guidance, never an arbitrary server string.
  if (isKnownMessage(message) && message.length <= 180 && !message.includes('\n')) return sourceMessage(message);
  return context === 'export'
    ? 'Export failed. Check the project before exporting again.'
    : 'The operation could not be completed. See error details.';
}

export function isConnectionFailure(message: string): boolean {
  return errorNoticeMessage(message) === 'Cannot connect to the local studio. Check that it is running.';
}
