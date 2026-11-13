import { useI18n } from "../../i18n/I18n";
import { PanelEmptyState } from "../ui/PanelEmptyState";
import type { DomEditSelection } from "./domEditingTypes";

/** A selected layer can have no controls in the current editor mode. */
export function PropertyPanelUnavailableState({ element }: { element: DomEditSelection }) {
  const { t } = useI18n();
  const composition = element.isCompositionHost && element.existsInSource !== false;
  return <PanelEmptyState
    icon="cursor-line"
    message={t(composition ? "Composition selected" : "No editable properties")}
    description={t(composition
      ? "Select a layer inside this composition to edit its properties."
      : "Select another layer or ask the agent to edit this element.")}
  />;
}
