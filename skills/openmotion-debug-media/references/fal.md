# fal.ai BYOK

Official references (checked 2026-11-13):

- [Get an API key](https://fal.ai/dashboard/keys)
- [Model catalog](https://fal.ai/models)
- [Queue API](https://fal.ai/docs/documentation/model-apis/inference/queue)
- [Submit](https://fal.ai/docs/api-reference/inference-api/queue/submit)
- [Status](https://fal.ai/docs/api-reference/inference-api/queue/status)
- [Result](https://fal.ai/docs/api-reference/inference-api/queue/result)
- [Cancel](https://fal.ai/docs/api-reference/inference-api/queue/cancel)
- [FLUX Schnell input reference](https://fal.ai/models/fal-ai/flux/schnell/api)
- [Kokoro input reference](https://fal.ai/models/fal-ai/kokoro/american-english/api)

Save your fal key in the editor's Media providers settings. The existing environment source is `FAL_KEY`; the service-owned saved key wins. The service stores credentials outside projects under the workspace's model-gateway directory with restricted permissions. The tool returns only configuration/source metadata, never the value.

`openmotion_media_use` maps provider `fal` to `Authorization: Key ...` and POST `https://queue.fal.run/{model}`. `model` is the full endpoint ID, including any nested path. `prompt` is added to model input; `mode: text-to-speech` sends it as `text`. Other fields go in `parameters`, using the exact selected model API schema, for example `image_size`, `duration`, `voice`, or public reference-media URLs. Do not include credentials, a model override or a prompt override in parameters.

The returned queue URLs are authoritative: status paths can differ from the submitted endpoint. The adapter validates their origin, polls the original task and fetches the completed result. It imports recognized image/video/audio outputs into the initiating project and preserves the remote request ID. The current adapter does not support 3D or arbitrary non-media output.

An accepted request may still fail. A 401/403 rejects the key/permission state; changing the key clears that evidence. Timeouts and a lost worker do not automatically resubmit. Cancel is best effort; remote work and charges can continue. Public model discovery alone does not validate the key, quota or model access.
