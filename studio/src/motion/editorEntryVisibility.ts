/** Visible entries only; editing commands, services and project data remain available. */
export const editorEntryVisibility = {
  generateMedia: false,
  timelineKeyframeControls: false,
};

export type EditorEntryVisibility = typeof editorEntryVisibility;

/** Studio without a configured host keeps its existing interface. */
export const allEditorEntriesVisible: EditorEntryVisibility = {
  generateMedia: true,
  timelineKeyframeControls: true,
};
