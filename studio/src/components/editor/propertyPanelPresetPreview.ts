import { translate, type Translate } from "../../i18n/I18n";
import type { NormalizedHfColorGrading } from "@hyperframes/core/color-grading";
import type { ColorGradingPreviewOptions } from "./useColorGradingController";

export function presetPreviewHandlers({
  id,
  label,
  resolve,
  onPreview,
  onCommit,
  onTrack,
  t = (message, values) => translate("en", message, values),
}: {
  id: string;
  label: string;
  resolve: () => NormalizedHfColorGrading;
  onPreview: (
    grading: NormalizedHfColorGrading | null,
    options?: ColorGradingPreviewOptions,
  ) => void;
  onCommit: (grading: NormalizedHfColorGrading) => void;
  onTrack: (label: string) => void;
  t?: Translate;
}) {
  return {
    title: t("Preview {value0}", { value0: t(label) }),
    onPointerEnter: () =>
      onPreview(resolve(), {
        animatedPreview: { kind: "presets" as const, id },
      }),
    onPointerLeave: () => onPreview(null),
    onFocus: () => onPreview(resolve()),
    onBlur: () => onPreview(null),
    onClick: () => {
      onTrack(label);
      onCommit(resolve());
    },
  };
}
