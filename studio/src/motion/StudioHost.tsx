import { createContext, useContext, type ReactNode, type ComponentType } from 'react';
import { allEditorEntriesVisible, type EditorEntryVisibility } from './editorEntryVisibility';

/** Product chrome only. Editing, panel state and rendering stay owned by Studio. */
export interface StudioHost {
  entryVisibility?: EditorEntryVisibility;
  brand?: ReactNode;
  projectLabel?: ReactNode;
  headerActions?: ReactNode;
  previewAction?: ReactNode;
  historyActions?: ReactNode;
  windowMenu?: ReactNode;
  languageMenu?: ReactNode;
  panels?: ReactNode;
  AppFrame?: ComponentType<{ children: ReactNode }>;
  EditorFrame?: ComponentType<{ children: ReactNode }>;
  HeaderFrame?: ComponentType<{ children: ReactNode }>;
  desktopLink?: boolean;
  feedback?: boolean;
  themeToggle?: boolean;
}

export const StudioHostContext = createContext<StudioHost | null>(null);
export const useStudioHost = () => useContext(StudioHostContext);
export const useEditorEntryVisibility = () => useStudioHost()?.entryVisibility ?? allEditorEntriesVisible;
