import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';

const origin = 'http://127.0.0.1:4173';
function api(store: any, openProject = async () => { throw new Error('The host must explicitly open the preview'); }) { return new Phase1Service(store, pluginRoot, {
  origin: () => origin, nativeUrl: () => undefined,
  openProject,
  mutation: async task => task(), cancel: async () => {},
}); }
async function create(service: Phase1Service) {
  return service.call('motion_create_project', { requestId: crypto.randomUUID(), projectType: 'natural_language', title: 'Preview handoff', requirements: 'An editable film' });
}
async function edit(service: Phase1Service, p: any, text: string, presentation?: string) {
  return service.call('motion_edit_project', { projectId: p.projectId, expectedRevision: p.revision, expectedVersionId: p.version.versionId,
    requestId: crypto.randomUUID(), files: [{ path: 'note.txt', content: text }], ...(presentation ? { presentation } : {}) });
}
function display(saved: any, visibility = 'visible', contentVerified = true) {
  return { projectId: saved.projectId, requestId: crypto.randomUUID(), action: 'record_display', display: {
    revision: saved.revision, versionId: saved.version.versionId, previewUrl: saved.previewHandoff.previewUrl,
    visibility, contentVerified, evidence: 'Host panel visibility read back; inspected the edited text in the live preview at 1s.' } };
}

test('default deferred preview preserves the current chat and resolves the latest version on return', () => fixture(async store => {
  const service = api(store, async () => {}), p = await create(service), first = await edit(service, p, 'first');
  const opened = await service.call('motion_open_preview', first.previewHandoff.nextAction.arguments);
  assert.equal(opened.previewHandoff.focusPolicy, 'preserve_current_chat');
  assert.equal(opened.previewHandoff.nextAction.codex.recovery.tool, undefined);
  const queued = display(first, 'hidden', false);
  queued.display = { ...queued.display, hostStatus: 'queued' } as any;
  const pending = await service.call('motion_open_preview', queued);
  assert.equal(pending.previewHandoff.state, 'pending');
  assert.equal(pending.previewHandoff.nextAction.operation, 'wait_for_calling_chat');
  const second = await edit(service, first, 'second');
  const resume = pending.previewHandoff.nextAction.onReturn;
  const latest = await service.call(resume.tool, resume.arguments);
  assert.equal(latest.currentVersionId, second.version.versionId);
  assert.equal(latest.previewHandoff.focusPolicy, 'preserve_current_chat');
  await assert.rejects(service.call('motion_open_preview', display(first)), /VERSION_CONFLICT/);
  assert.equal((await service.call('motion_open_preview', display({ ...second, previewHandoff: latest.previewHandoff }))).previewHandoff.state, 'confirmed');
}, false));

test('every edit returns a version-bound foreground handoff without claiming the host opened', () => fixture(async store => {
  const service = api(store), p = await create(service);
  const first = await edit(service, p, 'first');
  assert.equal(first.previewHandoff.state, 'pending');
  assert.equal(first.previewHandoff.revision, first.revision);
  assert.equal(first.previewHandoff.versionId, first.version.versionId);
  assert.equal(first.previewHandoff.placement, 'right');
  assert.equal(first.previewHandoff.reuseExistingTab, true);
  assert.equal(first.previewHandoff.openedByHost, false);
  assert.equal(new URL(first.previewHandoff.previewUrl).searchParams.get('project'), p.projectId);
  const args = display(first);
  const confirmed = await service.call('motion_open_preview', args);
  assert.equal(confirmed.previewHandoff.state, 'confirmed');
  assert.equal(confirmed.previewHandoff.confirmationSource, 'host_reported');
  assert.equal((await service.call('motion_open_preview', args)).replayed, true);
  const second = await edit(service, first, 'second');
  assert.equal(second.previewHandoff.state, 'pending');
  assert.notEqual(second.previewHandoff.versionId, first.previewHandoff.versionId);
  await assert.rejects(service.call('motion_open_preview', display(first)), /VERSION_CONFLICT/);
  await assert.rejects(service.call('motion_open_preview', args), /VERSION_CONFLICT/, 'replaying an old confirmation must not confirm the new version');
  await assert.rejects(service.call('motion_open_preview', { projectId: p.projectId, expectedRevision: first.revision, expectedVersionId: first.version.versionId }), /VERSION_CONFLICT/);
  const detail = await service.call('motion_get_project', { projectId: p.projectId });
  assert.equal(detail.previewDisplay.isCurrentVersion, false);
  assert.equal(detail.previewDisplay.liveVisibilityVerified, false);
}, false));

test('queued, hidden, unavailable and unverified content remain pending; background is explicit', () => fixture(async store => {
  const service = api(store), p = await create(service), saved = await edit(service, p, 'first');
  for (const visibility of ['queued', 'hidden', 'unavailable']) {
    const result = await service.call('motion_open_preview', display(saved, visibility));
    assert.equal(result.previewHandoff.state, 'pending');
    assert.equal(result.previewHandoff.openedByHost, false);
    assert.equal(result.previewHandoff.nextAction.kind, 'host');
  }
  assert.equal((await service.call('motion_open_preview', display(saved, 'visible', false))).previewHandoff.state, 'pending');
  const bad = display(saved); bad.display.previewUrl = origin + '/?project=' + crypto.randomUUID();
  await assert.rejects(service.call('motion_open_preview', bad), /PREVIEW_TARGET_MISMATCH/);
  const background = await edit(service, saved, 'background', 'background');
  assert.equal(background.previewHandoff.state, 'background');
  assert.equal(background.previewHandoff.hostActionRequired, false);
  assert.equal(background.previewHandoff.openedByHost, false);
  // The API defaults to foreground; the host must keep passing an active background preference.
  const foreground = await edit(service, background, 'foreground');
  assert.equal(foreground.previewHandoff.hostActionRequired, true);
}, false));

test('restoring identical content still requires a new display confirmation', () => fixture(async store => {
  const service = api(store), p = await create(service), first = await edit(service, p, 'first');
  await service.call('motion_open_preview', display(first));
  const second = await edit(service, first, 'second');
  const restored = await service.call('motion_restore_version', { projectId: p.projectId, requestId: crypto.randomUUID(),
    versionId: first.version.versionId, expectedRevision: second.revision, expectedVersionId: second.version.versionId });
  assert.equal(restored.previewHandoff.state, 'pending');
  assert.equal(restored.previewHandoff.versionId, restored.version.versionId);
  assert.equal(restored.revision, first.revision);
  assert.notEqual(restored.version.versionId, first.version.versionId);
  await assert.rejects(service.call('motion_open_preview', display(first)), /VERSION_CONFLICT/);
  assert.equal((await service.call('motion_get_project', { projectId: p.projectId })).previewDisplay.isCurrentVersion, false);
}, false));

test('opening prepares the host action without recursively reopening and preserves full-workspace links', () => fixture(async store => {
  let opened = 0;
  const service = api(store, async () => { opened++; }), p = await create(service);
  const saved = await edit(service, p, 'first');
  const result = await service.call('motion_open_preview', { ...saved.previewHandoff.nextAction.arguments, embedded: false });
  assert.equal(opened, 1);
  assert.equal(result.previewHandoff.nextAction.kind, 'host');
  assert.equal(result.previewHandoff.nextAction.codex.arguments.placement, 'right');
  assert.equal(result.previewHandoff.nextAction.codex.recovery.tool, undefined);
  assert.equal(result.previewHandoff.nextAction.codex.recovery.operation, 'wait_for_calling_chat');
  assert.equal(result.previewHandoff.nextAction.codex.arguments.threadId, undefined);
  assert.match(result.previewHandoff.nextAction.codex.tabIdentity, /providerTabId/);
  assert.deepEqual(result.previewHandoff.nextAction.codex.visibilitySync, {
    capability: 'visibility', method: 'set', value: true,
    when: 'after_binding_native_tab', scope: 'calling_chat_only', navigation: false,
  });
  assert.deepEqual(result.previewHandoff.nextAction.codex.observation, {
    visibility: 'get', settleTimeoutMs: 6000, content: 'latest_live_preview',
    recheckVisibilityAfterContent: true,
  });
  assert.equal(result.previewHandoff.previewUrl, result.previewUrl);
  assert.equal(new URL(result.previewUrl).searchParams.has('embed'), false);
  assert.equal(result.openedByHost, false);
  const receipt = display({ ...saved, previewHandoff: result.previewHandoff });
  assert.equal((await service.call('motion_open_preview', receipt)).previewHandoff.state, 'confirmed');
}, false));

test('only an explicit now request permits switching and it does not persist into the next turn', () => fixture(async store => {
  const service = api(store, async () => {}), p = await create(service), saved = await edit(service, p, 'show now', 'now');
  assert.equal(saved.previewHandoff.focusPolicy, 'switch_to_calling_chat');
  assert.equal(saved.previewHandoff.nextAction.arguments.presentation, 'now');
  const opened = await service.call('motion_open_preview', saved.previewHandoff.nextAction.arguments);
  assert.equal(opened.previewHandoff.nextAction.codex.recovery.tool, 'navigate_to_codex_page');
  assert.equal(opened.previewHandoff.nextAction.codex.recovery.scope, 'calling_chat_only');
  const pending = await service.call('motion_open_preview', { ...display(saved, 'hidden', false), presentation: 'now' });
  assert.equal(pending.previewHandoff.focusPolicy, 'switch_to_calling_chat');
  assert.equal(pending.previewHandoff.nextAction.codex.recovery.tool, 'navigate_to_codex_page');
  const next = await edit(service, saved, 'next ordinary edit');
  assert.equal(next.previewHandoff.focusPolicy, 'preserve_current_chat');
  const restored = await service.call('motion_restore_version', { projectId: p.projectId, requestId: crypto.randomUUID(),
    versionId: saved.version.versionId, expectedRevision: next.revision, expectedVersionId: next.version.versionId, presentation: 'now' });
  assert.equal(restored.previewHandoff.nextAction.arguments.presentation, 'now');
  assert.equal((await service.call('motion_open_preview', { projectId: p.projectId })).previewHandoff.focusPolicy, 'preserve_current_chat');
}, false));

test('a queued host acknowledgment can confirm an actually visible current preview', () => fixture(async store => {
  const service = api(store, async () => {}), p = await create(service), saved = await edit(service, p, 'latest');
  const nativeTabId = crypto.randomUUID();
  const visible = { ...display(saved), display: { ...display(saved).display, hostStatus: 'queued', hostTabId: nativeTabId } };
  const confirmed = await service.call('motion_open_preview', visible);
  assert.equal(confirmed.previewHandoff.state, 'confirmed');
  assert.equal(confirmed.display.hostStatus, 'queued');
  const second = await edit(service, saved, 'second');
  assert.equal(second.previewHandoff.state, 'pending');
  const reopened = await service.call('motion_open_preview', second.previewHandoff.nextAction.arguments);
  assert.equal(reopened.previewHandoff.nextAction.codex.arguments.target.tabId, nativeTabId);
  assert.equal(reopened.previewHandoff.nextAction.codex.arguments.target.url, reopened.previewUrl);
  assert.equal(reopened.previewHandoff.state, 'pending', 'reusing a native tab must not reuse its old content confirmation');
  const hidden = { ...display(second, 'hidden'), display: { ...display(second, 'hidden').display, hostStatus: 'queued' } };
  const pending = await service.call('motion_open_preview', hidden);
  assert.equal(pending.previewHandoff.state, 'pending');
  assert.equal(pending.previewHandoff.openedByHost, false);
}, false));

test('public MCP round trips expose the handoff and reject a stale host receipt', { timeout: 60_000 }, () => fixture(async store => {
  const { startServer } = await import('../server.ts');
  const { rpc } = await import('../mcp.ts');
  const { writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const running = await startServer(store, 0, { editor: false });
  const address = running.server.address(); assert.ok(address && typeof address !== 'string');
  await writeFile(join(store.directory, 'preview.json'), JSON.stringify({ port: address.port }));
  const call = async (name: string, args: any) => {
    const response: any = await rpc({ jsonrpc: '2.0', id: crypto.randomUUID(), method: 'tools/call', params: { name, arguments: args } }, store);
    return response.result;
  };
  try {
    const created = await call('motion_create_project', { requestId: crypto.randomUUID(), projectType: 'natural_language', title: 'RPC preview', requirements: 'Check a two-turn editing handoff' });
    assert.equal(created.isError, undefined);
    const p = created.structuredContent;
    const save = async (current: any, content: string) => call('motion_edit_project', { projectId: p.projectId, requestId: crypto.randomUUID(),
      expectedRevision: current.revision, expectedVersionId: current.version.versionId, files: [{ path: 'note.txt', content }] });
    const first = await save(p, 'first'); assert.equal(first.isError, undefined);
    assert.equal(first.structuredContent.previewHandoff.state, 'pending');
    const receipt = await call('motion_open_preview', display(first.structuredContent, 'queued', false));
    assert.equal(receipt.isError, undefined); assert.equal(receipt.structuredContent.previewHandoff.state, 'pending');
    const second = await save(first.structuredContent, 'second'); assert.equal(second.isError, undefined);
    assert.equal(second.structuredContent.previewHandoff.state, 'pending');
    const stale = await call('motion_open_preview', display(first.structuredContent));
    assert.equal(stale.isError, true); assert.match(JSON.stringify(stale), /VERSION_CONFLICT/);
    const unchanged = await call('motion_get_project', { projectId: p.projectId });
    assert.equal(unchanged.structuredContent.currentVersionId, second.structuredContent.version.versionId);
  } finally { await running.close(); }
}, false));

test('content changes during opening require rereading before a new preview handoff', () => fixture(async store => {
  const { writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  let changed = false;
  let projectId: string;
  const service = api(store, async () => {
    if (!changed) { changed = true; await writeFile(join(store.projectDirectoryFor(projectId), 'note.txt'), 'Changed while opening'); }
  });
  const p = await create(service); projectId = p.projectId;
  const saved = await edit(service, p, 'first');
  await assert.rejects(service.call('motion_open_preview', saved.previewHandoff.nextAction.arguments), /VERSION_CONFLICT/);
  const current = await service.call('motion_get_project', { projectId });
  assert.notEqual(current.currentVersionId, saved.version.versionId);
  const opened = await service.call('motion_open_preview', { projectId, expectedRevision: current.revision, expectedVersionId: current.currentVersionId });
  assert.equal(opened.previewHandoff.versionId, current.currentVersionId);
  await assert.rejects(service.call('motion_open_preview', display(saved)), /VERSION_CONFLICT/);
  const receipt = await service.call('motion_open_preview', display({ ...current, previewHandoff: opened.previewHandoff }));
  assert.equal(receipt.previewHandoff.state, 'confirmed');
}, false));
