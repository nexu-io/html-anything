import { useRef, useState } from "react";
import { useI18n } from "../i18n/I18n";
import type { ExternalFileChangeCoordinatorHandle } from "../hooks/useExternalFileChangeCoordinator";
import { saveFailureFeedback } from "../utils/saveFailureFeedback";
import { getStudioSaveStatusCode, getStudioSaveErrorMessage } from "../utils/studioSaveDiagnostics";

/** MVP recovery uses plain language; the coordinator remains the write authority. */
export function ConflictNotice({ coordinator }: { coordinator: ExternalFileChangeCoordinatorHandle }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const blocked = coordinator.blocked;
  if (!blocked) return null;
  const conflict = blocked.status === "conflict";
  const hasDraft = !conflict && blocked.studioContent != null;
  const canKeep = conflict || (hasDraft && blocked.recovered);
  const canRetry = !conflict && hasDraft && !blocked.recovered;
  // Without a known current version or a recoverable draft, don't invent a choice.
  const canUseUpdated = conflict || hasDraft || (blocked.payload != null && typeof blocked.payload === "object" && "content" in blocked.payload && typeof blocked.payload.content === "string");
  const reason = conflict
    ? "The project changed elsewhere. Changes were not saved."
    : saveFailureFeedback(getStudioSaveStatusCode(blocked.error) ?? null, getStudioSaveErrorMessage(blocked.error));
  const run = async (action: () => Promise<void>, confirmation?: string) => {
    if (running.current || (confirmation && !window.confirm(t(confirmation)))) return;
    running.current = true;
    setBusy(true);
    setActionError(null);
    try { await action(); }
    catch (error) { setActionError(saveFailureFeedback(getStudioSaveStatusCode(error) ?? null, getStudioSaveErrorMessage(error))); }
    finally { running.current = false; setBusy(false); }
  };
  return <div className="motion-conflict-notice" role="alert" aria-busy={busy}>
    <p>{t(actionError ?? reason)}</p>
    {(canUseUpdated || canKeep || canRetry) && <div className="motion-conflict-actions">
      {canUseUpdated && <button className="motion-button" disabled={busy} onClick={() => void run(coordinator.useExternalFile, "Use the updated version and discard your unsaved changes?")}>{t("Use updated version")}</button>}
      {canKeep && <button className="motion-button" disabled={busy} onClick={() => void run(coordinator.keepStudioFile, "Keep your changes and replace the version updated elsewhere?")}>{t("Keep my changes")}</button>}
      {canRetry && <button className="motion-button" disabled={busy} onClick={() => void run(coordinator.retry)}>{t("Retry saving")}</button>}
    </div>}
  </div>;
}
