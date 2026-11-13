import { publicToolName, legacyToolName } from './public-names.mjs';
const id = { type: 'string', minLength: 1, maxLength: 100 };
const projectId = { type: 'string', pattern: '^(project|[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12})$' };
const revision = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const text = { type: 'string', minLength: 1, maxLength: 8000 };
const presentation = { enum: ['foreground', 'background', 'now'], description: 'Default foreground shows the calling chat panel when active and queues only while inactive, without switching chats. Use now only for an explicit request to display immediately in this turn; background skips presentation.' };
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const review = object({ objectId: id, versionId: id, range: object({ start: { type: 'number', minimum: 0 }, end: { type: 'number', minimum: 0 } }, ['start', 'end']),
  conclusion: { enum: ['passed', 'failed', 'pending', 'unable_to_view'] }, evidence: text, source: { enum: ['agent', 'user'] } }, ['objectId', 'versionId', 'conclusion', 'evidence', 'source']);
const display = object({ revision, versionId: id, previewUrl: { type: 'string', minLength: 1, maxLength: 4000 },
  visibility: { enum: ['visible', 'queued', 'hidden', 'unavailable'], description: 'Observed native panel visibility. Use queued only when the host confirms the calling chat is inactive; a queued acknowledgment alone is insufficient. Otherwise use hidden or unavailable and report the display failure.' }, hostStatus: { type: 'string', minLength: 1, maxLength: 80, description: 'Host action acknowledgment, such as queued; independent of observed panel visibility.' }, hostTabId: { ...id, description: 'Actual native host Tab ID, such as providerTabId; never the CUA wrapper id. A reuse hint, not proof of current visibility.' }, contentVerified: { type: 'boolean' }, evidence: text },
  ['revision', 'versionId', 'previewUrl', 'visibility', 'contentVerified', 'evidence']);
const read = { readOnlyHint: true, openWorldHint: false };
const write = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };
export const phase1Tools = [
  { name: 'openmotion_media_use', title: 'OpenMotion · Media Use', description: 'Inspect enabled BYOK providers (fal.ai and OpenDesign Cloud), read their bundled references, list models, generate media, query or cancel a job. The local service injects the saved key; never pass credentials. Saving a key in editor Media providers enables it. Read action=reference before generation. Generate requires explicit projectId, requestId, provider, provider-native model ID, modality and prompt; returns queued, not media. Poll action=status with the same jobId. Only completed assets are imported; composition editing is separate. No automatic paid fallback or resubmission.',
    inputSchema: object({ action: { enum: ['inspect', 'reference', 'models', 'generate', 'status', 'cancel'] }, provider: { enum: ['fal', 'opendesign'] },
      projectId, requestId: id, jobId: id, model: { type: 'string', minLength: 1, maxLength: 180 }, modality: { enum: ['image', 'video', 'audio'] },
      mode: { enum: ['text-to-image', 'text-to-video', 'text-to-audio', 'text-to-speech'] }, prompt: { type: 'string', minLength: 1, maxLength: 20000 },
      parameters: { type: 'object', additionalProperties: true }, refresh: { type: 'boolean' }, query: { type: 'string', maxLength: 200 },
      offset: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 100 } }, ['action']),
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
  { name: 'openmotion_list_templates', title: 'OpenMotion · List Templates', description: 'Index templates from the loaded local repository; installations without a repository catalog use the configured CMS. Returns source, indexPath (local JSONL, one summary per template), total and catalogVersion, not search results. Read or grep/jq the file to select a template, then call openmotion_get_template. Repository summaries include localSource paths. No query or pagination arguments.', inputSchema: object({}), annotations: { ...read, openWorldHint: true } },
  { name: 'openmotion_get_template', title: 'OpenMotion · Get Template', description: 'Read one exact template ID and its TEMPLATE.md guidance. Repository entries include localSource absolute paths and the local motionDocument content. Guidance-only examples remain distinct from editable Studio projects. Use openmotion_create_project with projectType=template only when hasHtmlProject is true; otherwise apply the guidance while authoring a new project. Known IDs do not require listing first.', inputSchema: object({ templateId: id }, ['templateId']), annotations: { ...read, openWorldHint: true } },
  { name: 'openmotion_create_project', title: 'OpenMotion · Create Project', description: 'Create an independent editable native OpenMotion project from a prompt, an editable template ID or reference-video ID. The host Agent authors the film; creation does not generate a finished video. Persist requirements and source, return project/session IDs and the initial content version. A requestId is required for safe retries.',
    inputSchema: object({ requestId: id, projectType: { enum: ['natural_language', 'template', 'reference_video'] }, title: { type: 'string', minLength: 1, maxLength: 100 }, requirements: text,
      sessionId: projectId, templateId: id, referenceVideoId: id, referenceUrl: { type: 'string', maxLength: 2000 } }, ['requestId', 'projectType', 'title', 'requirements']), annotations: write },
  { name: 'openmotion_open_preview', title: 'OpenMotion · Open Preview', description: 'Prepare the named project in the shared editable Studio; this Tool does not open the host browser. Use target=templates to open the template library without creating/selecting a project; this target accepts only action=open, embedded and presentation and returns a page handoff without a project/version identity. Without projectId use only an explicitly bound OpenMotion session, never the global most-recent project. Follow previewHandoff to present the native panel and verify visibility plus latest content for first delivery and continued edits. Default foreground shows the active calling chat panel without switching chats; wait for return only when the host confirms that chat is inactive. A queued acknowledgment, hidden automation tab or markDeliverable does not complete delivery. Only an explicit show-now request uses presentation=now to permit switching for this turn. action=record_display records the current revision/version observation; queued or unverified content stays pending. Report a still-hidden panel as a display failure. action=record_review records evidence about a previously viewed frozen version without changing source.',
    inputSchema: object({ target: { enum: ['project', 'templates'] }, action: { enum: ['open', 'record_review', 'record_display'] }, projectId, sessionId: projectId, embedded: { type: 'boolean' }, presentation, expectedRevision: revision, expectedVersionId: id, requestId: id, review, display }, []), annotations: write },
  { name: 'openmotion_import_assets', title: 'OpenMotion · Import Assets', description: 'Persist a batch of real local attachments into this project, at most 500 MB (500000000 bytes) per file. Probe actual media and return per-item asset IDs, types, sizes, paths and errors. Successful items survive other failures. Existing history is not overwritten. Import does not place media on the timeline. Reuse the same requestId/itemId to retry without duplicate assets.',
    inputSchema: object({ projectId, requestId: id, items: { type: 'array', minItems: 1, maxItems: 100, items: object({ itemId: id, sourcePath: { type: 'string', minLength: 1, maxLength: 4096 }, name: { type: 'string', maxLength: 200 } }, ['itemId', 'sourcePath']) } }, ['projectId', 'requestId', 'items']), annotations: write },
  { name: 'openmotion_get_project', title: 'OpenMotion · Get Project', description: 'Without projectId list projects in the current workspace, newest creation first, exactly five per page (except the last); use nextCursor. With projectId read that project, current revision/version, requirements, native file inventory, asset references and associated export state. file supports bounded UTF-8 reads; exportJobId reads a historical task. This does not switch Studio or create projects.',
    inputSchema: object({ projectId, sessionId: projectId, cursor: { type: 'string', maxLength: 2000 }, file: object({ path: { type: 'string', minLength: 1, maxLength: 240 }, offset: { type: 'integer', minimum: 0 }, length: { type: 'integer', minimum: 1, maximum: 2097152 } }, ['path']), expectedRevision: revision, exportJobId: id }, []), annotations: read },
  { name: 'openmotion_edit_project', title: 'OpenMotion · Edit Project', description: 'Save the host Agent\'s native text-file batch and associated requirements into the explicitly named project. Check both expectedRevision and expectedVersionId, commit all files or none, protect GUI writes, record one complete content version and let Studio refresh. Every save returns a version-bound previewHandoff: preserve the current chat by default, queue when inactive and confirm the latest content on return. An accepted queued preview may be reported as saved and waiting for return. Only an explicit show-now request permits presentation=now for this turn; background skips presentation. The service does not generate code. Read project/version again after conflicts.',
    inputSchema: object({ projectId, requestId: id, expectedRevision: revision, expectedVersionId: id, presentation, requirements: text, summary: { type: 'string', maxLength: 300 },
      files: { type: 'array', maxItems: 100, items: object({ path: { type: 'string', minLength: 1, maxLength: 240 }, content: { type: 'string' } }, ['path', 'content']) } }, ['projectId', 'requestId', 'expectedRevision', 'expectedVersionId', 'files']), annotations: write },
  { name: 'openmotion_export_request', title: 'OpenMotion · Export Request', description: 'Queue a background MP4 of the explicit project version and immutable source/media snapshot. Automatically lint and fully technically verify the result. Return jobId; read progress/results with openmotion_get_project exportJobId. Export does not open the editor or complete an outstanding editable-preview handoff; follow openmotion_open_preview separately for creation/edit delivery. Repeated requestId returns the original task. action=record_review only records actual playback/visual/audio evidence for an existing job; it never starts another render.',
    inputSchema: object({ action: { enum: ['request', 'record_review'] }, projectId, requestId: id, expectedRevision: revision, versionId: id, jobId: id,
      audio: { enum: ['required', 'silent', 'optional'] }, review }, ['projectId', 'requestId']), annotations: write },
  { name: 'openmotion_list_versions', title: 'OpenMotion · List Versions', description: 'List consistent project content snapshots, not individual file save counts. Return current-version identity and five snapshots per page with a cursor for older pages, including stable IDs, vN labels, source, summary and restorability. Five is a page size, not a retention limit.',
    inputSchema: object({ projectId, cursor: { type: 'string', maxLength: 2000 } }, ['projectId']), annotations: read },
  { name: 'openmotion_restore_version', title: 'OpenMotion · Restore Version', description: 'Restore the explicitly selected project snapshot as a NEW version. Restoring v3 while current is v5 produces v6 with v3 content; v4 and v5 remain. Check current version/revision, restore native source, styles, timing and retained media together, and reject missing historical resources without changing the current project. Returns the same previewHandoff as a source edit; explicit background requests use presentation=background.',
    inputSchema: object({ projectId, requestId: id, versionId: id, expectedRevision: revision, expectedVersionId: id, presentation }, ['projectId', 'requestId', 'versionId', 'expectedRevision', 'expectedVersionId']), annotations: write },
  { name: 'openmotion_export_cancel', title: 'OpenMotion · Export Cancel', description: 'Cancel the specified export owned by this project. Distinguish cancellation accepted/cancelling from a confirmed cancelled terminal state. A completed task stays completed. Cancellation does not restore source, delete older results or promise a refund. Stopping a host conversation does not automatically call this tool.',
    inputSchema: object({ projectId, requestId: id, jobId: id }, ['projectId', 'requestId', 'jobId']), annotations: write },
];

// Increment for incompatible request/response semantics; optional fields and new Tools are additive.
export const phase1McpCapabilities = { protocol: 1, tools: phase1Tools.map(tool => tool.name) };

export function phase1TransportTool(health: { mcp?: { protocol?: unknown; tools?: unknown } }, tool?: string): string | undefined {
  const name = publicToolName(tool);
  if (typeof name !== 'string' || !phase1McpCapabilities.tools.includes(name)
    || health.mcp?.protocol !== phase1McpCapabilities.protocol || !Array.isArray(health.mcp.tools)) return;
  return [name, legacyToolName(name)].find(candidate => (health.mcp!.tools as unknown[]).includes(candidate));
}

export function supportsPhase1Tool(health: { mcp?: { protocol?: unknown; tools?: unknown } }, tool?: string): boolean {
  return phase1TransportTool(health, tool) !== undefined;
}

export function validateInput(schema: any, value: any, field = 'arguments'): void {
  if (schema.enum && !schema.enum.includes(value)) throw new Error('INVALID_ARGUMENT: ' + field);
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_ARGUMENT: ' + field + ' must be an object');
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) throw new Error('INVALID_ARGUMENT: ' + field + '.' + key + ' is required');
    for (const [key, child] of Object.entries(value)) {
      if (schema.additionalProperties === true && !Object.hasOwn(schema.properties ?? {}, key)) continue;
      if (!Object.hasOwn(schema.properties, key)) throw new Error('INVALID_ARGUMENT: unknown ' + field + '.' + key);
      validateInput(schema.properties[key], child, field + '.' + key);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) throw new Error('INVALID_ARGUMENT: ' + field);
    value.forEach((item, i) => validateInput(schema.items, item, field + '[' + i + ']'));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string' || value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity) || schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error('INVALID_ARGUMENT: ' + field);
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') throw new Error('INVALID_ARGUMENT: ' + field);
  else if (['number', 'integer'].includes(schema.type) && (typeof value !== 'number' || !Number.isFinite(value) || schema.type === 'integer' && !Number.isSafeInteger(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity))) throw new Error('INVALID_ARGUMENT: ' + field);
}
