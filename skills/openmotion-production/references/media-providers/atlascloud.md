# Atlas Cloud BYOK

Checked against official documentation on 2026-11-13. Sections: discovery, request templates, polling, errors, sources.

## Setup and discovery

Save the key in editor **Media providers**. `ATLASCLOUD_API_KEY` is the environment alternative; the saved key wins. The service injects `Authorization: Bearer ...`. Agents use `openmotion_media_use`; never read credential files or put keys in arguments. Shell examples document the wire protocol for service implementation or user-run diagnostics, using environment placeholders only.

```json
{"action":"models","provider":"atlascloud","refresh":true,"modality":"image","query":"nano-banana","limit":20}
```

Underlying public catalogue request:

```bash
curl --fail-with-body --silent --show-error 'https://api.atlascloud.ai/api/v1/models'
```

Read the response `data` array. Change or omit modality/query for video/audio. The tool returns normalized metadata, not every model's input schema. Confirm the selected model in the current [model library](https://www.atlascloud.ai/models) and read its API schema. Public discovery and cached/built-in examples do not establish key validity, balance or model entitlement.

## Request templates

These JSON objects are `openmotion_media_use` arguments. Replace the project ID and assign a unique requestId per intended generation. Verify current availability and schema first; generation can incur charges.

Image — [Nano Banana 2 text-to-image](https://www.atlascloud.ai/models/google/nano-banana-2/text-to-image):

```json
{"action":"generate","provider":"atlascloud","projectId":"project","requestId":"atlas-image-01","model":"google/nano-banana-2/text-to-image","modality":"image","mode":"text-to-image","prompt":"A ceramic cup on a wooden table, soft morning light","parameters":{"aspect_ratio":"1:1","resolution":"1k","output_format":"png"}}
```

Video — [Seedance 2.0 text-to-video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/text-to-video):

```json
{"action":"generate","provider":"atlascloud","projectId":"project","requestId":"atlas-video-01","model":"bytedance/seedance-2.0/text-to-video","modality":"video","mode":"text-to-video","prompt":"Steam rises from a ceramic cup as the camera slowly moves closer","parameters":{"duration":5,"resolution":"720p","aspect_ratio":"16:9","generate_audio":false}}
```

Speech — [audio input guide](https://www.atlascloud.ai/docs/models/audio):

```json
{"action":"generate","provider":"atlascloud","projectId":"project","requestId":"atlas-speech-01","model":"bytedance/seed-audio-1.0","modality":"audio","mode":"text-to-speech","prompt":"Welcome to a quiet morning.","parameters":{"format":"mp3","sample_rate":24000}}
```

Instrumental music — the same audio guide documents Suno's non-custom prompt input:

```json
{"action":"generate","provider":"atlascloud","projectId":"project","requestId":"atlas-music-01","model":"suno/chirp-v5","modality":"audio","mode":"text-to-audio","prompt":"A gentle instrumental piano piece for a quiet morning","parameters":{"instrumental":true}}
```

Suno can return multiple tracks. Custom lyrics/style modes have different required fields; consult the schema rather than reusing this minimal prompt template.

Wire mapping:

| Modality | POST path | JSON body |
| --- | --- | --- |
| Image | `/api/v1/model/generateImage` | `{model,prompt,...parameters}` |
| Video | `/api/v1/model/generateVideo` | `{model,prompt,...parameters}` |
| Speech (`text-to-speech`) | `/api/v1/model/generateAudio` | `{model,text,...parameters}` |
| Music (`text-to-audio`) | `/api/v1/model/generateAudio` | `{model,prompt,...parameters}` |

For example, the image request on the wire is:

```bash
curl --fail-with-body --silent --show-error 'https://api.atlascloud.ai/api/v1/model/generateImage' \
  -H "Authorization: Bearer ${ATLASCLOUD_API_KEY:?Set ATLASCLOUD_API_KEY locally}" \
  -H 'Content-Type: application/json' \
  --data '{"model":"google/nano-banana-2/text-to-image","prompt":"A ceramic cup on a wooden table, soft morning light","aspect_ratio":"1:1","resolution":"1k","output_format":"png"}'
```

Reference-media URLs, if the selected model supports them, belong in provider-native parameters. This tool does not upload local paths. Speech transcription, lyrics-only, LLM and 3D outputs are outside the media-file adapter.

## Polling and result

Read the envelope `code` and `data.id`. Query that same prediction:

```bash
curl --fail-with-body --silent --show-error \
  "https://api.atlascloud.ai/api/v1/model/prediction/${ATLAS_PREDICTION_ID:?Use original data.id}" \
  -H "Authorization: Bearer ${ATLASCLOUD_API_KEY:?Set ATLASCLOUD_API_KEY locally}"
```

The adapter waits through nonterminal states; `completed` / `succeeded` imports media from `data.outputs`. `failed`, `timeout`, `cancelled` or `canceled` ends local processing. Image Base64 output is also recognized. Agent polling uses the local ID, not the remote prediction ID:

```json
{"action":"status","projectId":"project","jobId":"LOCAL_JOB_ID_FROM_GENERATE"}
```

Submission is never automatically retried. Polling failure/local timeout does not prove a remote stop; cancellation is local and does not guarantee refunds. Query the original prediction before creating another billable task.

## Error interpretation

The [official error guide](https://www.atlascloud.ai/docs/errors) separates HTTP status, media response `{code,msg,request_id,data}` and asynchronous task failure (`data.error_code`, `data.error`). `X-Request-ID` can identify a call for support when available. Interpret the code in its actual layer.

| Signal | Actual possible meaning / next action |
| --- | --- |
| HTTP 400 | Malformed JSON, missing model, wrong content type or invalid request option. Inspect the submitted body and provider message. |
| HTTP 401 | Missing, unknown or expired key; **a wrong URL path can also return 401 because authentication precedes routing**. Verify `api.atlascloud.ai`, exact `/api/v1/model/...` path, Bearer scheme and saved-vs-environment key source. A 401 alone does not prove an incorrect key. |
| HTTP 402 | Balance/plan allowance exhausted. Check available funds or allowance; retrying unchanged cannot fix it. |
| HTTP 403 / 404 | Permission/scope or unavailable resource/model. A Coding Plan key may not permit the selected model. Verify account access and model ID. |
| HTTP 413 / 451 | Body too large (50 MB limit) / regional restriction. Use supported media URLs or resolve account/region access. |
| HTTP 429 | Account/model rate limit. Reduce concurrency and back off. Media APIs do not promise Retry-After or rate-limit headers. |
| HTTP 500 / 503 / 504 | Internal/unavailable service or synchronous wait timeout. Inspect an existing prediction before any new POST; an unknown outcome can still incur a charge. |
| Task `error_code: 1039` | Content moderation failure. Review the prompt/reference and provider detail; changing the key does not address it. Other task codes require the actual provider explanation. |

Current OpenMotion non-2xx handling omits the raw provider error body/headers. Its `credentials or permissions rejected` suffix is synthesized locally, not an Atlas diagnostic. When `msg`, `request_id` or `error_code` is unavailable, state that the exact cause is unknown and inspect provider history/support. Do not claim a missing detail was returned or expose authenticated headers.

## Sources

- [Key creation](https://www.atlascloud.ai/console/api-keys), [authentication](https://www.atlascloud.ai/docs/api-keys)
- [Prediction lifecycle](https://www.atlascloud.ai/docs/predictions), [audio models](https://www.atlascloud.ai/docs/models/audio), [errors and rate limits](https://www.atlascloud.ai/docs/errors)
