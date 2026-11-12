import { toastErrorMessage } from "./ui/toastErrorMessage";
import { RemixIcon } from "../icons/RemixIcons";
import { useI18n } from "../i18n/I18n";
import { systemMessage } from "../i18n/systemMessages";
interface StudioToastProps {
  message: string;
  tone?: "error" | "info";
  presentation?: "feedback";
  /** Plays the exit animation when true (owner removes the node after ~160ms). */
  leaving?: boolean;
  onDismiss?: () => void;
  singleLine?: boolean;
  status?: string;
}

export function StudioToast({ message, tone, presentation, leaving, onDismiss, singleLine, status }: StudioToastProps) {
  const { t } = useI18n();
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`pointer-events-auto max-w-full motion-reduce:animate-none ${leaving ? "hf-toast-exit" : "hf-toast-enter"}`}
    >
      {isError && presentation !== "feedback" ? <div className="flex max-w-[min(420px,calc(100vw-48px))] items-center gap-3 rounded-2xl bg-toast-feedback px-4 py-2 text-[12px] text-toast-feedback-ink shadow-popover">
        <span className="min-w-0 leading-5 [overflow-wrap:anywhere]">{t(toastErrorMessage(message))}</span>
        {onDismiss && <button type="button" className="grid h-6 w-6 shrink-0 place-items-center rounded hover:bg-white/10" aria-label={t('Dismiss error')} onClick={onDismiss}><RemixIcon name="close-line" size={14} /></button>}
      </div> : <div className={`max-w-[min(420px,calc(100vw-48px))] overflow-hidden rounded-2xl px-4 py-2 text-[12px] shadow-popover bg-toast-feedback text-toast-feedback-ink`}>
        <div className={status ? "flex min-w-0 items-center gap-3" : undefined}>
          <span className={singleLine ? "block min-w-0 truncate leading-5" : "line-clamp-3 leading-5 [overflow-wrap:anywhere]"} title={systemMessage(message, t)}>{systemMessage(message, t)}</span>
          {status && <span className="shrink-0 leading-5 opacity-70">
            {status === 'Reconnecting…' ? <>
              <span className="sr-only">{t(status)}</span>
              <span aria-hidden="true">{t(status).replace(/(?:…|\.{3})$/, '')}<span className="hf-toast-progress-dots"><span>.</span><span>.</span><span>.</span></span></span>
            </> : t(status)}
          </span>}
        </div>
      </div>}
    </div>
  );
}

export function toastSurface(isError: boolean): string {
  return `border shadow-popover bg-raised ${isError ? "border-danger/40" : "border-border"}`;
}
