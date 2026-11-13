---
name: openmotion-debug-media
description: Test configured fal.ai or OpenDesign Cloud media generation in an OpenMotion project with the temporary media-use tool. Use for BYOK media integration debugging, not creative direction or final audiovisual acceptance.
---

# Debug media

Temporary integration guidance; the production media workflow will be maintained separately.

Use `openmotion_media_use` for provider discovery, reference reading, generation, status and cancellation. The service reads the user's saved key and injects authentication. Never read secrets.json, print a key, place it in a prompt or ask the user to paste it into chat.

1. Call `action: "inspect"`. A configured key enables that provider. Configuration is not proof of permissions, balance or successful generation. Missing credentials: ask the user to open **Media providers** in the editor project drawer and configure the selected provider.
2. Call `action: "reference", provider: "fal" | "opendesign"`. Read the selected provider's returned reference before constructing a request. The same documents are available below and as MCP workflow resources.
3. Call `action: "models", provider, refresh: true`. Select a model the account can use; public fal discovery does not verify the key. Read its official model API page for provider-specific parameters. Do not change the user's chosen supplier or silently fall back to another paid source.
4. Read the explicitly selected project with `openmotion_get_project`. Generate with a stable `requestId`, that `projectId`, the provider, provider-native model ID, modality, prompt and provider-specific `parameters`. For speech, use `modality: "audio", mode: "text-to-speech"`; Cloud also requires `parameters.voice`.
5. Submission returns a queued job, not media. Poll `action: "status", projectId, jobId` using the same job ID. Never submit again to check progress. `action: "cancel"` requires the same project and a requestId; stopping local work does not promise a remote cancellation or refund.
6. Only `state: "completed"` with available assets means files were imported. Return the actual project-relative paths, media types, bytes and any failures to the Agent. To use a file in a composition, read the project's latest revision/version and call `openmotion_edit_project`. Generation itself does not place media or create a finished film.

Example fal submission (after reading the reference):

```json
{"action":"generate","provider":"fal","projectId":"project","requestId":"scene-1-image-v1","model":"fal-ai/flux/schnell","modality":"image","prompt":"A ceramic cup on a wooden table","parameters":{"image_size":"landscape_16_9"}}
```

References, loaded only for the chosen provider:

- [fal.ai](references/fal.md): key setup, model API links, queue semantics and input mapping.
- [OpenDesign Cloud](references/opendesign.md): Cloud workspace key, gateway origin, images/video/speech and billing boundaries.

Input URLs in provider parameters are sent to that provider. Local paths are not remote URLs. This debug tool does not upload local reference files; import or upload them through the provider's documented supported path first. Inspect actual outputs separately; protocol success does not establish visual/audio quality.
