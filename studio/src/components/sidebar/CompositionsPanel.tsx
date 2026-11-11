import { PanelEmptyState } from "../ui/PanelEmptyState";
import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useEmptyPreview } from "../nle/useEmptyPreview";
import type { ComponentProps } from "react";
import { resolveMasterCompositionPath } from "../../utils/studioUrlState";
import { useNLEContext } from "../nle/NLEContext";
import { CompositionsTab } from "./CompositionsTab";

type Props = Omit<ComponentProps<typeof CompositionsTab>, "masterCompositionPath" | "activeComposition">;

/** The Compositions dock panel body; the root badge comes from the filtered composition list. */
export function CompositionsPanel(props: Props) {
  const { compositionStack, compositionLoading } = useNLEContext();
  const mvp = useMvpEditor();
  const { t } = useI18n();
  const empty = useEmptyPreview(props.projectId, mvp && !compositionLoading && compositionStack.length === 1);
  const masterCompositionPath = resolveMasterCompositionPath(props.compositions);
  const previewId = compositionStack[compositionStack.length - 1]?.id;
  const activeComposition = previewId === "master" ? masterCompositionPath : previewId ?? null;
  const compositions = empty ? props.compositions.filter(path => path !== masterCompositionPath) : props.compositions;
  if (mvp && compositions.length === 0) return (
    <PanelEmptyState icon="film-line" message={t("No clips yet")} />
  );
  return (
    <CompositionsTab
      {...props}
      compositions={compositions}
      masterCompositionPath={masterCompositionPath}
      activeComposition={activeComposition}
    />
  );
}
