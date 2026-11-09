import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import { WorkspaceFrame } from './WorkspaceFrame';
import { motionApi, type ProjectCatalog } from './useWorkspace';
import { requestedProject, validWorkspaceProject } from './workspaceRouting';
import type { SessionDetail, SessionArtifact } from '../../../shared/session';
import { ArtifactViewer } from './ArtifactViewer';

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
  const [ready, setReady] = useState<{ sessionId: string; artifact?: SessionArtifact } | null>(null);
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    async function resolve() {
      const catalog = await motionApi<ProjectCatalog>('/projects', { signal: controller.signal });
      const targetProject = projectId ?? (sessionId ? null : catalog.activeId);
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
  }, [projectId, sessionId, attempt]);
  if (error) return <WorkspaceFrame waitForSaves={noPendingSaves}><div className="motion-route-state" role="alert"><h1>{t('Could not open project')}</h1><p>{t(error)}</p><div><a className="motion-button" href="/">{t('Open active project')}</a><button className="motion-button" onClick={() => retry(value => value + 1)}>{t('Retry')}</button></div></div></WorkspaceFrame>;
  const loading = <div className="motion-route-state" role="status">{t('Opening project…')}</div>;
  return ready ? <WorkspaceFrame waitForSaves={noPendingSaves} projectId={ready.artifact?.projectId} sessionId={ready.sessionId}>{ready.artifact ? <ArtifactViewer artifact={ready.artifact} /> : <div className="motion-route-state">{t('Create a project with your Agent to start editing.')}</div>}</WorkspaceFrame> : loading;
}
