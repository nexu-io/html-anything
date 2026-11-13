# fal.ai BYOK

Checked against official documentation on 2026-11-13. Sections: discovery, request templates, polling, errors, sources.

## Setup and discovery

Save the key in editor **Media providers**. `FAL_KEY` is the environment alternative; a saved key wins. The service injects `Authorization: Key ...` (not Bearer). Agents use `openmotion_media_use`; never read credential files or put keys in tool arguments. Shell examples describe the wire protocol for service implementation or user-run diagnostics, using environment placeholders only.

Call the tool with:

```json
{"action":"models","provider":"fal","refresh":true,"modality":"image","query":"flux","limit":20}
```

Equivalent public catalogue request (no authentication):

```bash
curl --fail-with-body --silent --show-error --get 'https://api.fal.ai/v1/models' \
  --data-urlencode 'status=active' --data-urlencode 'limit=100' --data-urlencode 'q=flux'
```

Read `models` and use `next_cursor` as the next `cursor` query parameter. The adapter follows at most three pages. Remove or change the tool's modality/query for video or audio. The tool normalizes model metadata; consult the selected model's API page for its full schema. Public discovery does not validate the saved key, balance or account access; cached/built-in entries are not live entitlement checks.

## Request templates

These are arguments to `openmotion_media_use`, not provider HTTP bodies. Replace `projectId` with the selected project's actual ID and choose a new `requestId` for each intended generation. Models/fields below are starting points; check the current model schema before submission. Each generate call can incur charges.

Image — [FLUX Schnell schema](https://fal.ai/models/fal-ai/flux/schnell/api):

```json
{"action":"generate","provider":"fal","projectId":"project","requestId":"fal-image-01","model":"fal-ai/flux/schnell","modality":"image","mode":"text-to-image","prompt":"A ceramic cup on a wooden table, soft morning light","parameters":{"image_size":"square_hd","num_images":1,"num_inference_steps":4,"output_format":"png"}}
```

Video — [Wan text-to-video schema](https://fal.ai/models/fal-ai/wan/v2.2-a14b/text-to-video/api):

```json
{"action":"generate","provider":"fal","projectId":"project","requestId":"fal-video-01","model":"fal-ai/wan/v2.2-a14b/text-to-video","modality":"video","mode":"text-to-video","prompt":"Steam rises from a ceramic cup as the camera slowly moves closer","parameters":{"num_frames":81,"resolution":"720p","aspect_ratio":"16:9"}}
```

Speech — [Kokoro schema](https://fal.ai/models/fal-ai/kokoro/american-english/api):

```json
{"action":"generate","provider":"fal","projectId":"project","requestId":"fal-speech-01","model":"fal-ai/kokoro/american-english","modality":"audio","mode":"text-to-audio","prompt":"Welcome to a quiet morning.","parameters":{"voice":"af_heart","speed":1}}
```

Kokoro expects **`prompt`**, so this adapter requires `mode: "text-to-audio"` even for spoken content. For a different speech model whose schema expects **`text`**, use `mode: "text-to-speech"`. This mode controls the input field, not whether the output contains speech. Do not assume every TTS model uses `text`.

Wire mapping: POST `https://queue.fal.run/{full model ID}` with `{...parameters,prompt}`; replace `prompt` with `text` only for `text-to-speech`. The full model ID stays in the URL, not the JSON body. The image template becomes:

```bash
curl --fail-with-body --silent --show-error 'https://queue.fal.run/fal-ai/flux/schnell' \
  -H "Authorization: Key ${FAL_KEY:?Set FAL_KEY locally}" -H 'Content-Type: application/json' \
  --data '{"prompt":"A ceramic cup on a wooden table, soft morning light","image_size":"square_hd","num_images":1,"num_inference_steps":4,"output_format":"png"}'
```

Reference-image/video/audio fields, if supported by the chosen model, belong in `parameters` under their exact schema names. Supply publicly reachable URLs; this tool does not upload local paths. Arbitrary text, 3D and training outputs are outside the media-file adapter.

## Polling and result

Submission returns `request_id`, `status_url`, `response_url` and optionally `cancel_url`. Use those returned URLs: nested model paths may have different polling paths. The adapter accepts only the `https://queue.fal.run` origin and preserves the remote request ID.

```bash
# Use original response URLs, verified to have origin https://queue.fal.run.
curl --fail-with-body --silent --show-error "${FAL_STATUS_URL:?Use returned status_url}" \
  -H "Authorization: Key ${FAL_KEY:?Set FAL_KEY locally}"
# Fetch only after status is COMPLETED; the result can still report a model error.
curl --fail-with-body --silent --show-error "${FAL_RESPONSE_URL:?Use returned response_url}" \
  -H "Authorization: Key ${FAL_KEY:?Set FAL_KEY locally}"
```

`IN_QUEUE` / `IN_PROGRESS` mean wait. `COMPLETED` means retrieve the result, not that generation necessarily succeeded. Recognized `images`, `video` or `audio` URLs are imported. In the Agent workflow poll the local job, without another generate call:

```json
{"action":"status","projectId":"project","jobId":"LOCAL_JOB_ID_FROM_GENERATE"}
```

Only local `completed` plus imported assets establishes media availability. Cancel uses the returned remote cancel URL on a best-effort basis; charges can continue. Polling errors/local deadlines do not prove remote cancellation. Submission is not automatically retried.

## Error interpretation

Distinguish HTTP status, provider error type and model validation detail. These are diagnostic categories, not a diagnosis from the status alone. See [request errors](https://fal.ai/docs/documentation/model-apis/request-errors) and [model errors](https://fal.ai/docs/documentation/model-apis/errors).

| Signal | Meaning / next action |
| --- | --- |
| HTTP 401 | Authentication did not succeed. Verify the `queue.fal.run` endpoint, `Key` scheme and configured credential source; a public catalogue success says nothing about authentication. Do not assert that the key expired without provider evidence. |
| HTTP 403 | Access was denied. Check the selected endpoint/account permission and actual provider detail; replacing the key is not a proven fix. |
| HTTP 400 / 422 | Inspect the selected model schema and validation detail: required field, type, allowed value or policy rejection. In particular, check `prompt` versus `text`. Correct the input before resubmitting. |
| HTTP 429 | Request/concurrency limits may apply. Reduce parallel work and follow provider retry guidance; do not repeatedly create paid jobs. |
| HTTP 5xx / network timeout | Transient failure or an uncertain submission outcome. If an ID exists, inspect that original request; otherwise check provider history before deciding on a new submission. |
| `error_type` / validation `detail` | Request errors can include a flat detail and `error_type`; model validation can include a detail array. `X-Fal-Error-Type` can add context when available. Preserve the distinction instead of calling every failure a key error. |

Current OpenMotion non-2xx handling does **not** expose the provider's raw body or response headers. `Provider HTTP 401: credentials or permissions rejected` is locally synthesized wording, not fal's confirmed explanation. Report missing detail as unknown; use provider-side request history/support for a definitive cause. Never include keys or authenticated headers in diagnostics.

## Sources

- [Key setup](https://fal.ai/dashboard/keys), [catalogue API](https://fal.ai/docs/platform-apis/v1/models)
- [Queue overview](https://fal.ai/docs/documentation/model-apis/inference/queue), [submit](https://fal.ai/docs/api-reference/inference-api/queue/submit), [status](https://fal.ai/docs/api-reference/inference-api/queue/status), [result](https://fal.ai/docs/api-reference/inference-api/queue/result), [cancel](https://fal.ai/docs/api-reference/inference-api/queue/cancel)
