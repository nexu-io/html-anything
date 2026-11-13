import { useI18n } from "../../i18n/I18n";
import type { Translate } from "../../i18n/messages";
import type { RenderJob } from "./useRenderQueue";

function renderStageLabel(stage: string | undefined, t: Translate, locale: string): string {
  if (!stage) return t("Rendering");
  if (locale === "en") return stage;
  const frames = /^(Capturing frame|Encoding frame) (\d+\/\d+)(?: \(\d+ workers?\))?$/.exec(stage);
  if (frames) return `${t(frames[1])} ${frames[2]}`;
  const browsers = /^Starting browsers \((\d+\/\d+) ready\)$/.exec(stage);
  if (browsers) return `${t("Starting browsers")} ${browsers[1]}`;
  const translated = t(stage);
  return translated === stage ? t("Rendering") : translated;
}

function formatTimeAgo(timestamp: number, locale: string): string {
  const diff = Date.now() - timestamp;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (diff < 60000) return formatter.format(0, 'second');
  if (diff < 3600000) return formatter.format(-Math.floor(diff / 60000), 'minute');
  return formatter.format(-Math.floor(diff / 3600000), 'hour');
}

export function RenderQueueInfo({ job }: { job: RenderJob }) {
  const { t, locale } = useI18n();
  const isRendering = job.status === "rendering";
  const filename = job.status === "failed" && ["Export failed", "Export blocked"].includes(job.filename) ? t(job.filename) : job.filename;
  return (
    <div className="flex-1 min-w-0 pr-2">
      <div className="flex items-center gap-1.5">
        <span title={filename} className="text-step-12 font-medium text-text-2 truncate">{filename}</span>
      </div>

      {isRendering && (
        <div className="mt-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-step-9 text-text-4">{renderStageLabel(job.stage, t, locale)}</span>
            <span className="text-step-9 font-mono text-accent-ink">{job.progress}%</span>
          </div>
          <div
            className="w-full h-1 bg-border rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={job.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("Render progress: {value0}%", { value0: job.progress })}
          >
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === "cancelled" && (
        <span className="text-step-9 text-text-4 mt-0.5 block">{t("Cancelled")}</span>
      )}

      {!isRendering && (
        <div className="mt-1 text-step-11 text-text-5">
          <span>{formatTimeAgo(job.createdAt, locale)}</span>
        </div>
      )}
    </div>
  );
}
