import type { WorkspaceStore } from '../workspace.ts';
import type { GenerateInput } from '../shared/gateway.ts';
import { gatewayFor } from './service.ts';
import { getWorkflow } from '../shared/workflow.ts';

export const mediaProviders = ['fal', 'opendesign'] as const;
export async function mediaUse(store: WorkspaceStore, args: any) {
  const gateway = gatewayFor(store);
  if (args.provider !== undefined && !mediaProviders.includes(args.provider)) throw new Error('INVALID_ARGUMENT: unsupported media provider');
  if (args.action === 'inspect') {
    const status = await gateway.status();
    return { providers: status.providers.filter(p => mediaProviders.includes(p.id as any)),
      settings: 'Open Media providers in the editor project drawer. Saving a key enables the provider.',
      references: mediaProviders.map(provider => ({ provider, uri: `openmotion://workflow/debug-media/${provider}` })),
      credentials: 'Read by the local service; keys are never returned to the Agent.' };
  }
  if (args.action === 'reference') {
    if (!args.provider) throw new Error('INVALID_ARGUMENT: provider is required');
    return getWorkflow(args.provider, 'debug-media');
  }
  if (args.action === 'models') {
    const providers = (await gateway.status()).providers.filter(p => mediaProviders.includes(p.id as any) && (!args.provider || p.id === args.provider) && p.enabled);
    const pages = await Promise.all(providers.map(provider => gateway.listModels({ provider: provider.id, modality: args.modality, refresh: args.refresh, query: args.query, offset: args.offset, limit: args.limit })));
    return { providers: providers.map(p => p.id), catalogs: pages, setupRequired: !providers.length };
  }
  if (!args.projectId || !store.projectCatalog().projects.some(p => p.id === args.projectId)) throw new Error('PROJECT_NOT_FOUND');
  if (args.action === 'generate') {
    if (!args.provider || !args.model || !args.requestId || !args.modality || typeof args.prompt !== 'string') throw new Error('INVALID_ARGUMENT: provider, model, projectId, requestId, modality and prompt are required');
    const job = await gateway.submit({ projectId: args.projectId, model: `${args.provider}:${args.model}`, modality: args.modality,
      prompt: args.prompt, parameters: args.parameters, mode: args.mode, idempotencyKey: args.requestId } as GenerateInput);
    return { projectId: job.projectId, job, next: { action: 'status', projectId: job.projectId, jobId: job.id } };
  }
  if (args.action === 'status' || args.action === 'cancel') {
    const job = await gateway.getJob(args.jobId);
    if (job.projectId !== args.projectId || !mediaProviders.includes(job.model.provider as any)) throw new Error('GENERATION_NOT_FOUND: job does not belong to this project');
    if (args.action === 'cancel' && !args.requestId) throw new Error('INVALID_ARGUMENT: requestId is required');
    return { projectId: job.projectId, job: args.action === 'cancel' ? await gateway.cancel(job.id) : job };
  }
  throw new Error('INVALID_ARGUMENT: unsupported media action');
}
