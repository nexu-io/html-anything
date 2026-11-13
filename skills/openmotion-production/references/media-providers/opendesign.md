# OpenDesign Cloud media

Based on the supplied Cloud media API contract; reviewed 2026-11-13. This is a test-stage contract. Sections: discovery, request templates, polling, errors, boundaries.

## Setup and discovery

Open the [Cloud dashboard](https://open-design.ai/cloud/dashboard), select the workspace and open API keys. Save its Cloud Key and the gateway origin shown there in editor **Media providers**. Do not substitute the website origin. A trailing `/v1` is normalized away. Environment alternatives are `OPENDESIGN_API_KEY` and `OPENDESIGN_MEDIA_ORIGIN`; the saved configuration takes priority.

The service injects `Authorization: Bearer ...`. Agents use `openmotion_media_use`, never credential files or key arguments. Shell examples describe the contract for implementation or user-run diagnostics, using environment placeholders only. Set `OPENDESIGN_MEDIA_ORIGIN` to the dashboard's HTTPS origin without `/v1` or a trailing slash.

```json
{"action":"models","provider":"opendesign","refresh":true,"modality":"image","limit":20}
```

Underlying authenticated query:

```bash
curl --fail-with-body --silent --show-error \
  "${OPENDESIGN_MEDIA_ORIGIN:?Use dashboard API origin}/api/v1/media/models" \
  -H "Authorization: Bearer ${OPENDESIGN_API_KEY:?Set OPENDESIGN_API_KEY locally}"
```

The response is `{models:[{model,kind,capabilities}]}`. Change/omit modality to discover video/audio. Account/workspace availability comes from this list, not the example names below. Tool entries are normalized; check the current contract/model capabilities for required options. Cached entries do not establish current entitlement. Billing and credentials belong to the Cloud workspace, not its upstream model vendor; workspace allowance is used first and additional use may consume recharge balance.

## Request templates

These are `openmotion_media_use` arguments. Replace the project ID and select a model actually enabled for this workspace. Each new intended generation needs a unique requestId and may incur charges.

Image:

```json
{"action":"generate","provider":"opendesign","projectId":"project","requestId":"cloud-image-01","model":"seedream-5.0-flash","modality":"image","mode":"text-to-image","prompt":"A ceramic cup on a wooden table, soft morning light","parameters":{}}
```

Video:

```json
{"action":"generate","provider":"opendesign","projectId":"project","requestId":"cloud-video-01","model":"doubao-seedance-2-5-260628","modality":"video","mode":"text-to-video","prompt":"Steam rises from a ceramic cup as the camera slowly moves closer","parameters":{"duration":5,"resolution":"720p"}}
```

Speech:

```json
{"action":"generate","provider":"opendesign","projectId":"project","requestId":"cloud-speech-01","model":"elevenlabs-v3","modality":"audio","mode":"text-to-speech","prompt":"Welcome to a quiet morning.","parameters":{"voice":"JBFqnCBsd6RMkjVDRZzb"}}
```

A contract alternative is model `byteplus-tts-2` with voice `zh_female_vv_uranus_bigtts`; choose a voice belonging to the selected model. Neither example proves workspace access.

Wire mapping (all paths are relative to the dashboard API origin):

| Type | POST path | JSON body | Poll path |
| --- | --- | --- | --- |
| Image | `/api/v1/media/images/generations` | `{model,prompt,...parameters}` | `/api/v1/media/images/tasks/{task_id}` |
| Video | `/api/v1/media/videos/tasks` | `{model,prompt,...parameters}` | `/api/v1/media/videos/tasks/{task_id}` |
| Speech | `/api/v1/media/audio/speech` | `{model,voice,parameters:{text,...options}}` | `/api/v1/media/audio/tasks/{task_id}` |

The speech adapter extracts `parameters.voice` and nests the remaining options, using the tool's prompt as `parameters.text`. Do not send fal-style flat speech fields. For example, the speech wire request is:

```bash
# New intended task: choose a new idempotency token. An exact retry must reuse it.
curl --fail-with-body --silent --show-error \
  "${OPENDESIGN_MEDIA_ORIGIN:?Use dashboard API origin}/api/v1/media/audio/speech" \
  -H "Authorization: Bearer ${OPENDESIGN_API_KEY:?Set OPENDESIGN_API_KEY locally}" \
  -H "Idempotency-Key: ${CLOUD_IDEMPOTENCY_KEY:?Choose a stable token for this submission}" \
  -H 'Content-Type: application/json' \
  --data '{"model":"elevenlabs-v3","voice":"JBFqnCBsd6RMkjVDRZzb","parameters":{"text":"Welcome to a quiet morning."}}'
```

Every provider submission includes `Idempotency-Key`. The service maps a stable tool requestId to its persisted local job and uses that job's UUID as the provider header; the strings need not match. Repeating an identical tool requestId/body returns the original local job and does not restart it. An exact provider-level submission retry must retain its original idempotency header/body. Changed inputs require a new intended task, not reuse of an old token.

## Polling and output retrieval

Submission returns HTTP 202 and `task_id`; this is acceptance, not an output file. For example, speech polling is:

```bash
curl --fail-with-body --silent --show-error \
  "${OPENDESIGN_MEDIA_ORIGIN:?Use dashboard API origin}/api/v1/media/audio/tasks/${CLOUD_TASK_ID:?Use original task_id}" \
  -H "Authorization: Bearer ${OPENDESIGN_API_KEY:?Set OPENDESIGN_API_KEY locally}"
```

Wait through `queued`, `pending`, `running`, `processing` or `submitted`. `succeeded` retrieves output; `failed` / `cancelled` ends local work. In the Agent workflow, poll the local ID:

```json
{"action":"status","projectId":"project","jobId":"LOCAL_JOB_ID_FROM_GENERATE"}
```

- Image/audio: download `assets[].url` without Cloud Authorization. If a signed URL expires, query the same task for renewed links rather than generating again.
- Video: after success, authenticated GET `/api/v1/media/videos/tasks/{task_id}/content`. The adapter handles direct bytes or a redirect, downloading the redirected media without forwarding Cloud credentials. Do not use an authenticated cross-origin redirect with `--location-trusted`.
- Only local `completed` with imported assets establishes project media availability. Generation alone does not insert timeline clips.

## Error interpretation

The supplied contract does **not** define a complete authoritative Cloud HTTP error-code table. The HTTP rows below are diagnostic hypotheses to confirm using an actual response/current Cloud documentation, not an invented guarantee of Cloud-specific meanings.

| Signal | Interpretation / next action |
| --- | --- |
| HTTP 401 | Authentication was not accepted. Check dashboard API origin/path, Bearer header, selected workspace key and saved-vs-environment source. Do not assert expired key, wrong key or insufficient balance without provider evidence. |
| HTTP 403 / 404 | Check workspace/model/task ownership, endpoint path and access. Confirm the actual Cloud code/message; HTTP status alone does not identify the exact permission/resource issue. |
| HTTP 400 / 422 | Check current contract fields: image/video fields are flat, speech text is nested and voice must match the model. Inspect actual validation detail if available. |
| Quota/balance rejection | Check workspace model allowance and recharge balance. The contract does not assign one guaranteed HTTP status to this case. |
| HTTP 429 / 5xx / network timeout | Possible limits/transient failure or uncertain outcome. Check the original task/history before another paid submit; do not assume a timeout means no task was created. |
| `audio_outcome_unknown` | Explicit unknown audio outcome. Query the original task and workspace usage before considering another generation. Do not treat it as a definite failure or a refund. |
| `status: failed` / `cancelled` | Terminal task state. Preserve task ID and available detail; transport success is not media success. Local cancellation alone does not prove the provider stopped. |
| Asset download failure after success | Check the original task/output link and expiry first. Regeneration can double-charge and does not fix a stale link. |

Current OpenMotion non-2xx handling does not expose raw Cloud error bodies/headers, and generic failed-task text may omit application codes such as `audio_outcome_unknown`. The suffix `credentials or permissions rejected` is synthesized locally. Report only observed status/detail; when absent, state that the exact cause is unknown and consult the workspace's task/usage view. Never expose keys or authenticated headers.

## Integration boundaries

The contract supplied for this integration is the source for the paths and examples above; no public per-endpoint specification is asserted. Use the [Cloud dashboard](https://open-design.ai/cloud/dashboard) for current API origin, workspace models and access instructions. Verify changed test-stage behavior against the current contract before adapting requests.

Cloud music has no submit endpoint in the supplied contract and is not exposed here. Local-reference upload, image edits and signed-upload/commit are not implemented in this debug adapter. Cancellation stops local work without promising a remote cancellation or refund; polling errors/timeouts never trigger automatic paid resubmission.
