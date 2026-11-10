import { StudioErrorBoundary } from '../components/StudioErrorBoundary';
import { I18nProvider, useI18n } from "../i18n/I18n";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStudioShellContext } from '../contexts/StudioContext';
import { TimelineHistoryButtons } from '../components/TimelineHistoryButtons';
import { isStudioEditSaving } from '../utils/studioPendingEdits';
import { MotionIcon } from './icons';
import { StudioHostContext, type StudioHost } from './StudioHost';
import { WorkspaceFrame, WorkspaceMenuButton, useWorkspaceChrome, useOptionalWorkspaceChrome } from './WorkspaceFrame';
import { MotionHistoryProvider, useMotionHistoryOperation } from './MotionHistoryState';
import { MediaGatewayProvider } from './MediaGatewayContext';
import { useShownStudioTheme } from '../utils/studioTheme';
import { workspacePresentation } from '../../../shared/workspace-url';
import { trackMotion } from './tracking';

function WorkspaceBrand() {
  const theme = useShownStudioTheme();
  return <span className="motion-header-brand">
    <WorkspaceMenuButton />
    <img src={`/web/design-system/opendesign-${theme === 'dark' ? 'light' : 'dark'}.svg`} alt="OpenDesign" width="104" height="18" />
  </span>;
}

export function MotionEditorFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { projectId, waitForPendingDomEditSaves, writeBlockedReason, renderQueue } = useStudioShellContext();
  const historyOperation = useMotionHistoryOperation();
  const chrome = useOptionalWorkspaceChrome();
  const register = chrome?.registerEditor;
  const [saving, setSaving] = useState(isStudioEditSaving);
  const load = useRef({ id: crypto.randomUUID(), sent: false });
  useEffect(() => {
    if (load.current.sent) return;
    load.current.sent = true;
    void trackMotion('studio_load_result', { load_id: load.current.id, outcome: 'success',
      embedded: workspacePresentation(location.search).embedded, duration_ms: Math.min(86_400_000, Math.round(performance.now())) });
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setSaving(isStudioEditSaving()), 250);
    return () => clearInterval(timer);
  }, []);
  const blocked = renderQueue.isRendering || historyOperation.busy || Boolean(writeBlockedReason);
  const saveState = t(historyOperation.busy ? 'Updating version…' : renderQueue.isRendering ? 'Rendering…' : writeBlockedReason ? 'Needs attention' : saving ? 'Saving…' : '');
  useEffect(() => {
    register?.({ waitForSaves: waitForPendingDomEditSaves, blocked, saveState, message: writeBlockedReason || '' });
    return () => register?.(null);
  }, [register, waitForPendingDomEditSaves, blocked, saveState, writeBlockedReason]);
  const editor = <MediaGatewayProvider>{children}</MediaGatewayProvider>;
  if (chrome) return editor;
  return <WorkspaceFrame projectId={projectId} waitForSaves={waitForPendingDomEditSaves} blocked={blocked} message={writeBlockedReason || ''} saveState={saveState}>{editor}</WorkspaceFrame>;
}

function WorkspaceProject() {
  const { t } = useI18n();
  const { workspace, switchingDisabled, saveState } = useWorkspaceChrome();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const project = workspace.projects.find(item => item.id === workspace.status?.projectId);
  const editingRef = useRef(false);
  const savingRef = useRef(false);
  const finishEditing = () => { editingRef.current = false; setEditing(false); };
  const saveTitle = async () => {
    if (!editingRef.current || savingRef.current) return;
    const nextTitle = title.trim();
    if (!project || !nextTitle || nextTitle === project.title) { finishEditing(); return; }
    savingRef.current = true;
    try { if (await workspace.rename(project.id, nextTitle)) finishEditing(); }
    finally { savingRef.current = false; }
  };
  return <span className="motion-project-control">
    <input
      className="motion-project-name-input"
      maxLength={100}
      aria-label={t('Project name')}
      value={editing ? title : project?.title || ''}
      placeholder={t('Connecting…')}
      disabled={workspace.busy || switchingDisabled || !project}
      onFocus={() => {
        if (editingRef.current) return;
        setTitle(project?.title || '');
        editingRef.current = true;
        setEditing(true);
      }}
      onChange={event => setTitle(event.target.value)}
      onBlur={() => void saveTitle()}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finishEditing();
          event.currentTarget.blur();
        }
      }}
    />
    {saveState && <span className="motion-save-state" role="status">{saveState}</span>}
  </span>;
}

function WorkspaceHistoryActions() {
  const operation = useMotionHistoryOperation();
  return <div className="motion-history-actions">
    <TimelineHistoryButtons canUndo={operation.busy ? false : undefined} canRedo={operation.busy ? false : undefined} />
  </div>;
}

function WorkspaceActions() {
  const { t } = useI18n();
  const { switchingDisabled, openLibrary } = useWorkspaceChrome();
  return <div className="motion-workspace-actions">
    <button className="motion-button motion-button-quiet" aria-haspopup="dialog" disabled={switchingDisabled} onClick={openLibrary}><MotionIcon name="grid" />{t("Template library")}</button>
  </div>;
}

const host: StudioHost = {
  mvpEditor: true,
  brand: <WorkspaceBrand />,
  projectLabel: <WorkspaceProject />,
  headerActions: <WorkspaceActions />,
  historyActions: <WorkspaceHistoryActions />,
  previewAction: <></>,
  windowMenu: <></>,
  themeToggle: false,

  AppFrame: MotionEditorFrame,
  desktopLink: false,
  feedback: false,
};

export function MotionStudioHost({ children }: { children: ReactNode }) {
  return <I18nProvider><MotionHistoryProvider><StudioHostContext.Provider value={host}><StudioErrorBoundary>{children}</StudioErrorBoundary></StudioHostContext.Provider></MotionHistoryProvider></I18nProvider>;
}
