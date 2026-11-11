import type { ComponentProps } from "react";
import { resolveMasterCompositionPath } from "../../utils/studioUrlState";
import { useNLEContext } from "../nle/NLEContext";
import { CompositionsTab } from "./CompositionsTab";

type Props = Omit<ComponentProps<typeof CompositionsTab>, "masterCompositionPath" | "activeComposition">;

/** The Compositions dock panel body; the root badge comes from the filtered composition list. */
export function CompositionsPanel(props: Props) {
  const { compositionStack } = useNLEContext();
  const masterCompositionPath = resolveMasterCompositionPath(props.compositions);
  const previewId = compositionStack[compositionStack.length - 1]?.id;
  const activeComposition = previewId === "master" ? masterCompositionPath : previewId ?? null;
  return (
    <CompositionsTab
      {...props}
      masterCompositionPath={masterCompositionPath}
      activeComposition={activeComposition}
    />
  );
}
