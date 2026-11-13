import { setTimeout as delay } from 'node:timers/promises';
import type { Model } from '../shared/gateway.ts';
import { apiJson, publicProviderFetch, ProviderError, type Fetcher } from './network.ts';
import type { ProviderAdapter } from './providers.ts';

export async function cloudModels(baseUrl: string, key: string, fetcher: Fetcher = publicProviderFetch): Promise<Model[]> {
  const body = await apiJson(fetcher, baseUrl + '/api/v1/media/models', { headers: { Authorization: `Bearer ${key}` } });
  if (!Array.isArray(body.models)) throw new Error('OpenDesign Cloud catalogue format changed');
  return body.models.filter((row: any) => typeof row.model === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,179}$/.test(row.model)
    && ['image', 'video', 'audio'].includes(row.kind)).map((row: any) => ({
    id: 'opendesign:' + row.model, provider: 'opendesign', modelId: row.model, label: row.model,
    modality: row.kind, mode: row.kind === 'audio' ? 'text-to-speech' : 'text-to-' + row.kind, source: 'live',
  }));
}

export const opendesign: ProviderAdapter = {
  async generate(job, ctx) {
    if (!ctx.baseUrl) throw new Error('OpenDesign Cloud API origin required');
    const fetcher = ctx.fetcher === fetch ? publicProviderFetch : ctx.fetcher;
    const headers = { Authorization: `Bearer ${ctx.key}`, 'Content-Type': 'application/json' };
    const api = ctx.baseUrl + '/api/v1/media';
    const audio = job.modality === 'audio';
    if (audio && job.model.mode !== 'text-to-speech') throw new Error('OpenDesign Cloud currently supports speech audio only');
    const { voice, ...parameters } = { ...job.model.defaults, ...job.parameters };
    if (audio && (typeof voice !== 'string' || !voice.trim())) throw new Error('Choose a provider voice ID in parameters.voice');
    const payload = audio ? { model: job.model.modelId, voice, parameters: { ...parameters, text: job.prompt } }
      : { ...parameters, model: job.model.modelId, prompt: job.prompt };
    const endpoint = audio ? '/audio/speech' : job.modality === 'image' ? '/images/generations' : '/videos/tasks';
    const submitted = await apiJson(fetcher, api + endpoint, { method: 'POST', headers: { ...headers, 'Idempotency-Key': job.id }, body: JSON.stringify(payload), signal: ctx.signal });
    if (typeof submitted.task_id !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(submitted.task_id)) throw new Error('OpenDesign Cloud did not return a task ID');
    await ctx.progress('submitted', submitted.task_id);
    const taskUrl = api + `/${audio ? 'audio' : job.modality === 'image' ? 'images' : 'videos'}/tasks/${submitted.task_id}`;
    for (;;) {
      await delay(ctx.pollMs ?? 2000, undefined, { signal: ctx.signal });
      const result = await apiJson(fetcher, taskUrl, { headers, signal: ctx.signal });
      if (result.status === 'succeeded') {
        if (job.modality === 'video') {
          const response = await fetcher(taskUrl + '/content', { headers, redirect: 'error', signal: ctx.signal });
          if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) return [new URL(response.headers.get('location')!, taskUrl).href];
          if (!response.ok) throw new ProviderError(`OpenDesign Cloud content HTTP ${response.status}`, response.status);
          return [Buffer.from(await response.arrayBuffer())];
        }
        const urls = result.assets?.map((asset: any) => asset.url).filter((url: unknown) => typeof url === 'string');
        if (!urls?.length) throw new Error('OpenDesign Cloud completed without media output');
        return urls.slice(0, 8);
      }
      if (['failed', 'cancelled'].includes(result.status)) throw new Error(`OpenDesign Cloud task ${result.status}; inspect the original task before retrying`);
      if (!['queued', 'pending', 'running', 'processing', 'submitted'].includes(result.status)) throw new Error('OpenDesign Cloud returned an unknown task status');
      await ctx.progress('generating');
    }
  },
};
