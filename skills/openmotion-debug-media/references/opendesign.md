# OpenDesign Cloud media

Use the [Cloud dashboard](https://open-design.ai/cloud/dashboard), select the workspace, and open API keys. Reuse its Cloud Key and copy the gateway origin shown there. Set the API origin in Media providers; a trailing `/v1` is normalized away. Do not use the website origin unless it is the API origin shown for the key. Environment alternatives are `OPENDESIGN_API_KEY` and `OPENDESIGN_MEDIA_ORIGIN`.

This integration follows the supplied Cloud media API contract. It is a test-stage API: availability is determined by the workspace model list, not by example model names. Credentials and billing belong to the Cloud workspace, not directly to the upstream model vendor. Workspace model allowance is used first; any difference can consume the recharge balance.

The service adds `Authorization: Bearer ...`. It reads the saved key itself; never read or expose credential files. Every new task has an Idempotency-Key. Retry the same submission with the same requestId and identical inputs; checking progress uses the original job ID instead.

- Models: `GET /api/v1/media/models`, response `{models:[{model,kind,capabilities}]}`. Image/video entries are discovered here; voice models require account access as well.
- Image: `POST /api/v1/media/images/generations`, body `{model,prompt,...parameters}`. Poll `GET /api/v1/media/images/tasks/{task_id}`; successful output uses `assets[].url`.
- Video: `POST /api/v1/media/videos/tasks`, body `{model,prompt,...parameters}`. Poll `GET /api/v1/media/videos/tasks/{task_id}`; after success download `/api/v1/media/videos/tasks/{task_id}/content` with the same authentication. Example fields: `duration`, `resolution`.
- Speech: `POST /api/v1/media/audio/speech`, body `{model,voice,parameters:{text,...options}}`. The tool takes `parameters.voice` and `prompt` and builds this shape. Use `mode: "text-to-speech"`. Poll `GET /api/v1/media/audio/tasks/{task_id}`; successful output uses `assets[].url`.

Submission returns 202 and task_id. Terminal states are succeeded, failed and cancelled. Example voice models from the contract are `elevenlabs-v3` and `byteplus-tts-2`. Choose a voice belonging to the selected model: e.g. ElevenLabs `JBFqnCBsd6RMkjVDRZzb`, BytePlus `zh_female_vv_uranus_bigtts`. Examples are not proof of workspace entitlement.

Cloud image/video parameters are top-level fields; speech options are nested under parameters by the adapter. Query original tasks after an unknown outcome before creating a new billable task. Local cancellation prevents further import but does not promise remote cancellation/refunds. The supplied contract does not specify a music submit endpoint, so Cloud music is not exposed by this adapter. Local-reference upload, image edits and signed-upload/commit are not implemented in this first debug integration.
