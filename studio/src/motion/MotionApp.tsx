import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import { WorkspaceFrame, WorkspaceMenuButton, useWorkspaceChrome } from './WorkspaceFrame';
import { motionApi, type ProjectCatalog } from './useWorkspace';
import { requestedProject, validWorkspaceProject } from './workspaceRouting';
import type { SessionDetail, SessionArtifact } from '../../../shared/session';
import { ArtifactViewer } from './ArtifactViewer';
import { MotionLoading } from './MotionLoading';
import { trackMotion } from './tracking';

const noPendingSaves = async () => {};

export async function resolveWorkspaceProject(id: string, signal: AbortSignal) {
  if (!validWorkspaceProject(id)) throw new Error('项目链接无效');
  const catalog = await motionApi<ProjectCatalog>('/projects', { signal });
  if (!catalog.projects.some(project => project.id === id)) throw new Error('项目不存在，请从左侧列表选择一个项目。');
  signal.throwIfAborted();
  await motionApi('/preview/open', { method: 'POST', signal }, id);
}

/** Resolve the native service before mounting any editor that could read or save files. */
export function MotionApp() {
  const { t } = useI18n();
  const [projectId] = useState(() => requestedProject(location.search, location.hash));
  const [sessionId] = useState(() => new URLSearchParams(location.search).get('session'));
  const [libraryOnly, setLibraryOnly] = useState(() => new URLSearchParams(location.search).get('templates') === '1' && projectId === null && !sessionId);
  const [ready, setReady] = useState<{ sessionId: string; artifact?: SessionArtifact } | null>(null);
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  const view = useRef({ id: crypto.randomUUID(), started: performance.now(), sent: false });
  useEffect(() => {
    if (view.current.sent || (!ready && !error && !libraryOnly)) return;
    view.current.sent = true;
    const embedded = new URLSearchParams(location.search).get('embed') === '1';
    if (ready || libraryOnly) void trackMotion('page_view', { page_name: 'studio', view_id: view.current.id, embedded, has_project: Boolean(ready?.artifact) });
    if (error) void trackMotion('studio_load_result', { load_id: view.current.id, outcome: 'failure', embedded,
      duration_ms: Math.min(86_400_000, Math.round(performance.now() - view.current.started)) });
  }, [projectId, sessionId, ready, error, libraryOnly]);
  useEffect(() => {
    if (ready) return;
    const controller = new AbortController();
    setError('');
    async function resolve() {
      const catalog = await motionApi<ProjectCatalog>('/projects', { signal: controller.signal });
      const targetProject = projectId ?? (sessionId ? null : catalog.activeId);
      // The first-run placeholder has no native source yet. Browsing must not create it.
      // Existing projects can prepare behind the modal without changing the active project.
      if (libraryOnly && targetProject === 'project') return;
      const id = sessionId ?? catalog.sessions?.find(item => item.artifacts.some(artifact => artifact.projectId === targetProject))?.id;
      if (!id || !validWorkspaceProject(id)) throw new Error('会话不存在');
      const session = await motionApi<SessionDetail>(`/sessions/${id}`, { signal: controller.signal });
      if (!session.artifacts.length && projectId === null) { setReady({ sessionId: id }); return; }
      const artifact = session.artifacts.find(item => item.projectId === targetProject) ?? (targetProject === null ? session.artifacts.find(item => item.id === session.activeArtifactId) ?? session.artifacts[0] : undefined);
      if (!artifact) throw new Error('该产物不属于此会话');
      await resolveWorkspaceProject(artifact.projectId, controller.signal);
      if (controller.signal.aborted) return;
      const url = new URL(location.href); url.searchParams.set('session', id); url.searchParams.set('project', artifact.projectId);
      if (!url.hash.startsWith(`#project/${artifact.projectId}`)) url.hash = `project/${artifact.projectId}`;
      history.replaceState(null, '', url);
      setReady({ sessionId: id, artifact });
    }
    void resolve().catch(err => { if (!controller.signal.aborted) setError((err as Error).message); });
    return () => controller.abort();
  }, [projectId, sessionId, attempt, libraryOnly]);
  const closeLibrary = () => {
    const url = new URL(location.href);
    url.searchParams.delete('templates');
    history.replaceState(null, '', url);
    setLibraryOnly(false);
  };
  return <WorkspaceFrame waitForSaves={noPendingSaves} projectId={ready?.artifact?.projectId}
    sessionId={libraryOnly ? undefined : ready?.sessionId} onLibraryClose={libraryOnly ? closeLibrary : undefined}>
    {error ? <div className="motion-route-state" role="alert"><h1>{t('Could not open project')}</h1><p>{t(error)}</p><div><WorkspaceMenuButton /><a className="motion-button" href="/">{t('Open active project')}</a><button className="motion-button" onClick={() => retry(value => value + 1)}>{t('Retry')}</button></div></div>
      : ready ? ready.artifact ? <ArtifactViewer artifact={ready.artifact} /> : <div className="motion-route-state"><WorkspaceMenuButton />{t('Create a project with your Agent to start editing.')}</div>
      : libraryOnly ? <TemplateLibraryLanding /> : <MotionLoading />}
  </WorkspaceFrame>;
}

function TemplateLibraryLanding() {
  const { t } = useI18n();
  const { openLibrary } = useWorkspaceChrome();
  return <div className="motion-route-state"><WorkspaceMenuButton /><h1>{t('Template library')}</h1>
    <button className="motion-button" onClick={event => openLibrary(event.currentTarget)}>{t('View all templates')}</button>
  </div>;
}
