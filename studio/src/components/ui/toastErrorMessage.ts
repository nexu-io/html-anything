import { isKnownMessage, sourceMessage } from '../../i18n/messages';

/** Toasts show recognized causes, never raw diagnostics or a details affordance. */
export function toastErrorMessage(raw: string): string {
  const message = sourceMessage(raw);
  if (/^VERSION_NOT_RESTORABLE:/.test(message)) return 'Historical files are unavailable. Version not restored.';
  if (/ENOENT|no such file|file not found|文件.*(?:丢失|不存在)|找不到.*文件/i.test(message)) {
    return 'Required file not found.';
  }
  if (/EACCES|EPERM|permission denied|access denied|no permission|权限不足|拒绝访问/i.test(message)) {
    return 'No permission to access this file.';
  }
  if (/failed to fetch|network error|networkerror|fetch failed|ECONNREFUSED|connection.*(?:lost|refused|failed)|连接.*(?:失败|中断)/i.test(message)) {
    return 'Connection lost.';
  }
  if (/external change|changed elsewhere|revision.*(?:changed|mismatch)|version mismatch|conflict|项目已切换|工程状态.*不匹配/i.test(message)) {
    return 'The project changed elsewhere.';
  }
  if (/unsupported.*(?:format|codec)|(?:format|codec).*not supported|不支持.*格式/i.test(message)) {
    return 'This file format is not supported.';
  }
  if (/preview.*(?:did not reload|could not|failed|timeout|timed out)|预览.*(?:失败|超时)/i.test(message)) {
    return /timeout|timed out|still waiting|超时/i.test(message)
      ? 'Preview update timed out.' : 'Preview could not be updated.';
  }
  if (/couldn.t save|could not save|failed to save|无法保存|保存失败/i.test(message)) {
    return 'Changes could not be saved.';
  }
  if (isKnownMessage(message) && message.length <= 180 && !/\n|details|Something went wrong/i.test(message)) return message;
  return 'Action not completed. Please try again.';
}
