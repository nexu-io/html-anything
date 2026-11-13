# WaveSpeedAI BYOK

Checked against official documentation on 2026-11-13. Sections: discovery, request templates, polling, errors, sources.

## Setup and discovery

Save the key in editor **Media providers**. `WAVESPEED_API_KEY` is the environment alternative; a saved key wins. The service injects `Authorization: Bearer ...`. Agents use `openmotion_media_use`; never read credential files or put keys in tool arguments. Shell examples document the wire protocol for service implementation or user-run diagnostics, using environment placeholders only.

```json
{"action":"models","provider":"wavespeed","refresh":true,"modality":"video","query":"hunyuan","limit":20}
```

Underlying authenticated request:

```bash
curl --fail-with-body --silent --show-error 'https://api.wavespeed.ai/api/v3/models' \
  -H "Authorization: Bearer ${WAVESPEED_API_KEY:?Set WAVESPEED_API_KEY locally}"
```

The envelope uses `code: 200`; read `data[].model_id`, `name`, `type`. Raw entries can include `api_schema.api_schemas[].request_schema`; the tool returns normalized metadata rather than the full schema. Use the selected model's official API page for required inputs and output format. Change or omit modality/query for image/audio. Cached/built-in entries are not live account or balance checks.

## Request templates

These are arguments to `openmotion_media_use`. Replace the project ID and assign a new requestId per intended generation. Check current model availability/schema before submitting; generation can incur charges.

Image — [REST API example](https://wavespeed.ai/docs/rest-api):

```json
{"action":"generate","provider":"wavespeed","projectId":"project","requestId":"wave-image-01","model":"wavespeed-ai/z-image/turbo","modality":"image","mode":"text-to-image","prompt":"A ceramic cup on a wooden table, soft morning light","parameters":{"size":"1024*1024"}}
```

Video — [Hunyuan text-to-video](https://wavespeed.ai/models/wavespeed-ai/hunyuan-video/t2v):

```json
{"action":"generate","provider":"wavespeed","projectId":"project","requestId":"wave-video-01","model":"wavespeed-ai/hunyuan-video/t2v","modality":"video","mode":"text-to-video","prompt":"Steam rises from a ceramic cup as the camera slowly moves closer","parameters":{"size":"1280*720"}}
```

Speech — [speech API example](https://wavespeed.ai/docs/generate-speech):

```json
{"action":"generate","provider":"wavespeed","projectId":"project","requestId":"wave-speech-01","model":"minimax/speech-2.6-hd","modality":"audio","mode":"text-to-speech","prompt":"Welcome to a quiet morning.","parameters":{"voice_id":"Friendly_Person","speed":1}}
```

Voice IDs belong to the selected model. Music/SFX models can also appear in audio discovery, but their schemas differ from speech; do not send `voice_id` or assume a `text` field without checking that model.

Wire mapping: POST `https://api.wavespeed.ai/api/v3/{full model ID}`, body `{...parameters,prompt}` or `{...parameters,text}` for `text-to-speech`. The model ID belongs in the path, not the body. The image template becomes:

```bash
curl --fail-with-body --silent --show-error 'https://api.wavespeed.ai/api/v3/wavespeed-ai/z-image/turbo' \
  -H "Authorization: Bearer ${WAVESPEED_API_KEY:?Set WAVESPEED_API_KEY locally}" \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"A ceramic cup on a wooden table, soft morning light","size":"1024*1024"}'
```

Reference-media URLs, if supported, go in the selected model's exact parameter fields. Local paths are not uploaded. Only image/video/audio files are imported; LLM, training and 3D outputs are outside this adapter.

## Polling and result

Save the response `data.id` and query the original task:

```bash
curl --fail-with-body --silent --show-error \
  "https://api.wavespeed.ai/api/v3/predictions/${WAVE_PREDICTION_ID:?Use original data.id}/result" \
  -H "Authorization: Bearer ${WAVESPEED_API_KEY:?Set WAVESPEED_API_KEY locally}"
```

The adapter constructs this fixed-origin polling path; it does not forward the key to arbitrary returned URLs. `data.status: completed` imports `data.outputs`; `failed`, `cancelled`, `canceled`, `timeout` or `deleted` stops local processing. Other statuses keep polling. In the Agent workflow use the local ID:

```json
{"action":"status","projectId":"project","jobId":"LOCAL_JOB_ID_FROM_GENERATE"}
```

Submission is never automatically retried. The provider recommends backoff for transient **GET** failures, honoring Retry-After where supplied. The current adapter does not implement that read retry: a poll error stops local work while preserving the remote ID. Its worker deadline is fifteen minutes. The remote task may continue; inspect provider history/the original task before any new paid POST. Cancellation is local and does not guarantee a remote stop or refund.

## Error interpretation

Read [authentication](https://wavespeed.ai/docs/api-authentication), [error codes](https://wavespeed.ai/docs/error-codes) and [retry semantics](https://wavespeed.ai/docs/errors-retries-timeouts). HTTP status, top-level envelope `code: 200` and task error codes are different layers; a task success code `0` is not an HTTP status.

| Signal | Actual possible meaning / next action |
| --- | --- |
| HTTP 401 | Missing/invalid authentication. Check API origin/path, Bearer scheme and credential source. Do not infer insufficient balance from 401. |
| HTTP 403 | Key creator's role, endpoint permission or IP allowlist can deny access. For an allowlist, check the service's public outbound IP. `API_KEY_PERMISSION_FORBIDDEN` adds permission evidence if actually returned. |
| HTTP 400 / task 1400 or 1401 | Invalid request, missing required input or invalid parameter. Check model schema, `size` syntax, and `text` versus `prompt`. |
| Task 1200 | Content moderation. Review the prompt/reference against provider policy; unchanged retries are not a fix. |
| Task 1402 | Provider could not fetch reference media. Check public reachability, expiry and format; a local path is not a URL. |
| Task 1407 | Insufficient credits. Check balance; this differs from an authentication failure. |
| HTTP 429 | Rate limit. Reduce concurrency/back off and honor Retry-After if available. Distinguish safe read retries from creating another paid job. |
| Task 1403 / 1405 / 1406 | Execution failure / unknown failure / provider retries exhausted. Inspect task detail/history before deciding whether to regenerate. |
| HTTP 5xx / task 5000, 5003 or 5004 | Internal, unavailable or timed-out processing. A timeout can leave work running; query the original ID before resubmitting. |
| HTTP 400 with code 4005 / 4006 / 4007 | Pricing calculation / media duration / image dimension could not be determined. Inspect the model/input media rather than replacing a key. |

Current OpenMotion non-2xx handling omits raw provider bodies and response headers; failed-task messages can also omit detailed task codes. Its `credentials or permissions rejected` suffix is local wording, not the provider's diagnosis. Report only actually observed codes; if detail is absent, use provider history/support and mark the cause unknown. Never expose keys or authenticated headers.

## Sources

- [Key setup](https://wavespeed.ai/accesskey), [model list/schema](https://wavespeed.ai/docs/list-models)
- [REST API](https://wavespeed.ai/docs/rest-api), [speech](https://wavespeed.ai/docs/generate-speech), [troubleshooting](https://wavespeed.ai/docs/troubleshooting-guide)
