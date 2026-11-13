---
name: openmotion-onboarding
description: Welcome the user after OpenMotion plugin setup and open its template library.
---

# OpenMotion onboarding

Read [the installation-success contract](../../docs/install.md#installation-success-reply) and follow it in this conversation. Reuse the installed connection and data directory; setup is already complete, so do not reinstall.

Open the template library in the calling chat's right panel using the returned preview handoff, then call the natively discovered presentation tool with `onboarding: true` and `language` matching the latest user request (or their explicit requested output language), never the host interface language. Use `zh`, `en`, `ja`, `ko`, `fr`, `es` or `pt`; use `en` for unsupported languages. The component displays the persistent welcome and three cards; send no separate welcome, duplicated template descriptions or trailing status reply. Verify the actual opening result and use the matching welcome example from the contract. Keep project creation and export pending until the user submits a creation request.
