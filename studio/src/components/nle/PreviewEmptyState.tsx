import { useI18n } from "../../i18n/I18n";
import { useMediaGateway } from "../../motion/MediaGatewayContext";
import { usePreviewReadOnly } from "../editor/previewReadOnlyContext";

export function PreviewEmptyState() {
  const { t } = useI18n();
  const gateway = useMediaGateway();
  const readOnly = usePreviewReadOnly();
  return <div className="motion-preview-empty" data-preview-empty>
    <div className="motion-preview-empty-content">
      <p>{t("Drop video, audio or images here")}</p>
      {gateway && <button className="motion-button" disabled={readOnly} onClick={gateway.importFiles}>{t("Import files")}</button>}
    </div>
  </div>;
}
