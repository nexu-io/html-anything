export type WorkspacePresentation = { embedded: boolean; sidebar: boolean; conversation: boolean };
export function workspacePresentation(search: string): WorkspacePresentation {
  const query = new URLSearchParams(search), embedded = query.get('embed') === '1';
  return { embedded, sidebar: !embedded && query.get('sidebar') !== '0', conversation: !embedded && query.get('conversation') !== '0' };
}
export function sessionPath(sessionId: string, projectId?: string, options: { openArtifact?: boolean; embedded?: boolean } = {}) {
  const query = new URLSearchParams({ session: sessionId });
  if (projectId) query.set('project', projectId);
  if (options.openArtifact) query.set('openArtifact', '1');
  if (options.embedded) query.set('embed', '1');
  return '/?' + query + (projectId ? '#project/' + encodeURIComponent(projectId) : '');
}
export function preservePresentation(target: string, search: string) {
  const url = new URL(target, 'http://workspace.local'), current = new URLSearchParams(search);
  for (const key of ['embed', 'sidebar', 'conversation']) if (current.has(key)) url.searchParams.set(key, current.get(key)!);
  const tracking = current.get('tracking_context');
  if (tracking && /^[0-9a-f-]{36}$/i.test(tracking) && !url.searchParams.has('tracking_context')) url.searchParams.set('tracking_context', tracking);
  return url.pathname + url.search + url.hash;
}

/** Browsing the library has no project, session or content-version identity. */
export function templateLibraryPreview(origin: string, options: { embedded?: boolean; presentation?: string } = {}) {
  const query = new URLSearchParams({ templates: '1' });
  if (options.embedded !== false) query.set('embed', '1');
  const previewUrl = origin + '/?' + query;
  const presentation = options.presentation ?? 'foreground';
  const background = presentation === 'background';
  return { target: 'templates', previewUrl, projectCreated: false, openedByHost: false,
    previewHandoff: { target: 'templates', previewUrl, placement: 'right', reuseExistingTab: true, presentation,
      focusPolicy: background ? 'background' : presentation === 'now' ? 'switch_to_calling_chat' : 'preserve_current_chat',
      state: background ? 'background' : 'pending', openedByHost: false, hostActionRequired: !background,
      nextAction: background ? null : { kind: 'host', operation: 'present_preview', previewUrl, placement: 'right', reuseExistingTab: true,
        codex: { tool: 'open_in_codex', arguments: { placement: 'right', target: { type: 'browser', url: previewUrl } } } },
      instructions: 'Open previewUrl in the host built-in browser in the calling chat. Reuse a matching native host tab in this chat after checking its identity and URL; preserve all URL parameters. Present it immediately when this chat is active. Queue without switching only when the host confirms this chat is inactive; a queued acknowledgment alone does not prove inactivity. Only presentation=now permits switching. Observe settled native panel visibility and template library content before reporting it opened. If presentation fails or the native tab is gone, retry presentation once, then report the display failure without repeatedly creating tabs. A prepared URL, hidden automation tab or queued acknowledgment is not visible delivery. On return from a deferred chat, recheck the live library. If the host has no browser, provide the actual link and state the limitation. Browsing and previewing templates must not create a project. Create only after the user selects Open and edit or explicitly asks the Agent to use an exact template. No project record_display receipt is needed for this page.' } };
}
