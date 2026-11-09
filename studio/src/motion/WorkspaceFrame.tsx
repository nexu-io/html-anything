import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18n';
import { LanguageMenu } from '../i18n/LanguageMenu';
import { ConnectionDialog } from './ConnectionDialog';
import { MotionIcon } from './icons';
import { useWorkspace } from './useWorkspace';
import { ThemeToggle } from '../components/ThemeToggle';
import { Tooltip } from '../components/ui/Tooltip';
import { Dialog } from '@base-ui/react/dialog';
import { useShownStudioTheme } from '../utils/studioTheme';
import { workspacePresentation } from '../../../shared/workspace-url';

type WorkspaceChrome = {
  workspace: ReturnType<typeof useWorkspace>;
  switchingDisabled: boolean;
  saveState: string;
  openLibrary: () => void;
  openConnections: () => void;
  openModelSettings: () => void;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  registerEditor: (guard: EditorGuard | null) => void;
  beforeViewChange: () => Promise<void>;
};
export type EditorGuard = { waitForSaves: () => Promise<void>; blocked: boolean; saveState: string; message: string };
const WorkspaceChromeContext = createContext<WorkspaceChrome | null>(null);
export const useOptionalWorkspaceChrome = () => useContext(WorkspaceChromeContext);
export function useWorkspaceChrome() {
  const value = useContext(WorkspaceChromeContext);
  if (!value) throw new Error('Workspace controls require WorkspaceFrame');
  return value;
}

export function WorkspaceFrame({ children, waitForSaves, projectId, sessionId, blocked = false, message = '', saveState = '' }: {
  children: ReactNode; waitForSaves: () => Promise<void>; projectId?: string; sessionId?: string; blocked?: boolean; message?: string; saveState?: string;
}) {
  const { t } = useI18n();
  const presentation = workspacePresentation(location.search);
  const guard = useRef<EditorGuard | null>(null);
  const [editorState, setEditorState] = useState<Pick<EditorGuard, 'blocked' | 'saveState' | 'message'> | null>(null);
  const registerEditor = useCallback((value: EditorGuard | null) => {
    guard.current = value;
    setEditorState(previous => previous?.blocked === value?.blocked && previous?.saveState === value?.saveState && previous?.message === value?.message ? previous : value);
  }, []);
  const beforeViewChange = useCallback(async () => {
    if (guard.current?.blocked) throw new Error(guard.current.message || t('Working…'));
    await (guard.current?.waitForSaves ?? waitForSaves)();
  }, [waitForSaves, t]);
  const workspace = useWorkspace(beforeViewChange, projectId, sessionId);
  const [connectionSection, setConnectionSection] = useState<'setup' | 'templates'>(() => 'templates');
  const [connectionsOpen, setConnectionsOpen] = useState(() => new URLSearchParams(location.search).get('templates') === '1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const switchingDisabled = workspace.busy || blocked || Boolean(editorState?.blocked) || !workspace.status;
  const notice = workspace.error || message || editorState?.message;
  const value: WorkspaceChrome = { workspace, switchingDisabled, saveState: workspace.busy ? t('Working…') : editorState?.saveState || saveState, registerEditor, beforeViewChange,
    openLibrary: () => { workspace.clearError(); setConnectionSection('templates'); setConnectionsOpen(true); },
    openConnections: () => {},
    openModelSettings: () => {},
    toggleSidebar: () => setSidebarOpen(open => !open), sidebarOpen };
  return <WorkspaceChromeContext.Provider value={value}>
    <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
    <div className="motion-workspace" data-embedded={presentation.embedded}>
      <Dialog.Portal>
        <Dialog.Backdrop className="motion-sidebar-backdrop" />
        <Dialog.Popup className="motion-sidebar-drawer" aria-label={t('Project list')} onKeyDown={event => event.stopPropagation()}>
          <WorkspaceSidebar currentId={projectId} close={() => setSidebarOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
      <div className="motion-workspace-content">
        {notice && <div className="motion-workspace-notice" role="alert"><span>{t(notice)}</span>{workspace.error && <button className="motion-icon-button" aria-label={t('Dismiss')} onClick={workspace.clearError}><MotionIcon name="close" /></button>}</div>}
        {children}
      </div>
    </div>
    </Dialog.Root>
    {connectionsOpen && <ConnectionDialog open section={connectionSection} busy={switchingDisabled} error={workspace.error} onClose={() => setConnectionsOpen(false)} onOpen={id => { if (!switchingDisabled) void (sessionId ? workspace.createArtifact(sessionId, id) : workspace.startSession(undefined, id)); }} />}
  </WorkspaceChromeContext.Provider>;
}

function WorkspaceSidebar({ currentId, close }: { currentId?: string; close: () => void }) {
  const { t } = useI18n();
  const theme = useShownStudioTheme();
  const { workspace, switchingDisabled } = useWorkspaceChrome();
  const [query, setQuery] = useState('');
  const projects = workspace.projects;
  const filtered = projects.filter(project => project.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <aside className="motion-sidebar" aria-label={t('Workspace navigation')}>
    <div className="motion-sidebar-brand">
      <Dialog.Close className="motion-icon-button" aria-label={t('Close project list')}><MotionIcon name="sidebar" size={16} /></Dialog.Close>
      <div className="motion-brand">
        <img className="motion-brand-logo" src={`/web/design-system/opendesign-${theme === 'dark' ? 'light' : 'dark'}.svg`} alt="OpenDesign" width="104" height="18" />
      </div>
    </div>
    <div className="motion-session-heading">
      <span>{t('Projects')}</span>
      <Tooltip label={t('New project')}>
        <button type="button" className="motion-icon-button" aria-label={t('New project')} disabled={switchingDisabled} onClick={() => void workspace.create()}>
          <MotionIcon name="plus" size={16} />
        </button>
      </Tooltip>
    </div>
    <label className="motion-session-search"><MotionIcon name="search" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search projects…')} aria-label={t('Search projects')} /></label>
    <nav className="motion-session-list" aria-label={t('Project list')}>
      {!workspace.status && !workspace.error && <p className="motion-session-empty" role="status">{t('Loading projects…')}</p>}
      {workspace.status && !filtered.length && <p className="motion-session-empty">{t(query ? 'No matching projects' : 'Create a project with your Agent to start editing.')}</p>}
      {filtered.map(project => <button key={project.id} className="motion-session" aria-current={currentId === project.id ? 'page' : undefined}
        title={project.title} disabled={switchingDisabled} onClick={() => { if (project.id === currentId) close(); else void workspace.open('projects', project.id); }}>
        <MotionIcon name="message" /><span><strong>{project.title}</strong></span>
      </button>)}
    </nav>
    <footer className="motion-sidebar-footer">
      <div className="motion-sidebar-settings"><ThemeToggle /><LanguageMenu /></div>
    </footer>
  </aside>;
}

export function WorkspaceMenuButton() {
  const { t } = useI18n();
  const { toggleSidebar, sidebarOpen } = useWorkspaceChrome();
  return <button className="motion-icon-button motion-workspace-menu" onClick={toggleSidebar} aria-expanded={sidebarOpen} title={t(sidebarOpen ? 'Collapse project list' : 'Open project list')} aria-label={t(sidebarOpen ? 'Collapse project list' : 'Open project list')}><MotionIcon name="sidebar" size={16} /></button>;
}
