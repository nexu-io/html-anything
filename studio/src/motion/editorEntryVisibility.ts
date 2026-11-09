import { PANEL_IDS, type PanelId } from '../components/dock/panelRegistry';

/** Entry visibility only: project data, commands, MCP and rendering keep their existing behavior. */
export const editorEntryVisibility = {
  workspaceHome: false,
  newSession: false,
  connectAgent: false,
  modelSettings: false,
  conversation: false,
  browserChrome: false,
  versionHistory: false,
  previewSwitch: false,
  capture: false,
  inspectorToggle: false,
  panelLayoutControls: false,
  codePanel: false,
  variablesPanel: false,
  motionBlurPanel: false,
  compositionInlineActions: false,
  manualLint: false,
  generateMedia: false,
  replaceImage: false,
  assetExtraActions: false,
  canvasTransformHandles: false,
  canvasTools: false,
  playbackAdvancedControls: false,
  keyboardHelp: false,
  recordMotion: false,
  animationControls: false,
  propertyKeyframes: false,
  advancedGeometry: false,
  advancedTypography: false,
  advancedStyles: false,
  gpuEncoding: false,
  timelineKeyframeControls: false,
  timelineHistoryButtons: false,
  linkedSelection: false,
  rippleEditing: false,
  thumbnailToggle: false,
  addBeat: false,
  clipExtraActions: false,
};

export type EditorEntryVisibility = typeof editorEntryVisibility;

/** Unbranded Studio retains its complete UI; Motion supplies its explicit configuration through the existing host. */
export const allEditorEntriesVisible = Object.fromEntries(
  Object.keys(editorEntryVisibility).map(key => [key, true]),
) as EditorEntryVisibility;

export function visibleEditorPanels(entries: EditorEntryVisibility): PanelId[] {
  const visibility: Partial<Record<PanelId, boolean>> = {
    code: entries.codePanel,
    variables: entries.variablesPanel,
    motionBlur: entries.motionBlurPanel,
    history: entries.versionHistory,
  };
  return PANEL_IDS.filter(id => visibility[id] !== false);
}
