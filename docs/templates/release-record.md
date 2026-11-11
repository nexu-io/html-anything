# Motion candidate acceptance record

The candidate artifact includes this checklist as `acceptance.md` with its package/source/hash identity already filled. Keep the completed copy and attachments internally. Do not attach user material, credentials, internal URLs or the completed record to public artifacts. No manual file hash is required by the release form.

## Generated frozen identity

<!-- CANDIDATE_IDENTITY -->

The release builder replaces this marker. Do not change its generated identity; fill only the tester context and results below. In a source checkout, download the generated checklist from the actual candidate instead.

## Tester context

- Integration PR / source review / artifact expiry:
- Template environment / Resource / locale / catalog publication version:
- Supported OS / CPU / Node / npm / host versions:
- Acceptance owner / reviewer (if used) / release operator:
- Prior accepted compatible version or backup (or none):

## Acceptance matrix

Use PASS / FAIL / NOT RUN and link retained evidence. CI success alone cannot fill this table.

| Check | macOS arm64 | Windows x64 | Evidence / accepted limitation |
| --- | --- | --- | --- |
| Exact candidate tgz fresh install in an isolated host/profile | NOT RUN | NOT RUN | |
| Prepare Chromium, FFmpeg and ffprobe; repeat setup/cache reuse | NOT RUN | NOT RUN | |
| Preserve existing projects/material and unrelated host settings | NOT RUN | NOT RUN | |
| MCP Tools/resources and Skills discovery in the actual host | NOT RUN | NOT RUN | |
| Template list/detail/clone; actual environment and catalog identity | NOT RUN | NOT RUN | |
| Real Agent creation/adaptation, preview, edit, save and reopen | NOT RUN | NOT RUN | |
| MP4 export with required audio, decoded technical verification | NOT RUN | NOT RUN | |
| Normal-speed human visual/audio playback | NOT RUN | NOT RUN | |
| Upgrade from prior usable version and compatible recovery | NOT RUN | NOT RUN | |

## Release decision

- Blockers / accepted non-blocking issues / owner / workaround:
- Public source/package scans, dependency/license review and telemetry state:
- Approved exact version and TGZ SHA256:
- Reviewer / date / explicit release authorization:
- Internal retained record revision / filename (keep this private):
- The release operator selects the matching test/stable channel and this exact version in Motion npm publication. No acceptance checkbox or independent approval environment is enabled; the operator remains responsible for completing required stable checks before dispatch. Record failures and unrun checks honestly.

## Publication follow-up

- Publication run / npm exact version / registry hash and integrity:
- Native registry cold-install report per platform, including embedded/installed template environment:
- Verified npm test/latest promotion / prior channel version / promotion run:
- Immutable R2 version / release-record / guide URL and verified hash:
- Default entry / previous entry / final publication phase:
- Failure, recovery or user feedback:

Retain the completed acceptance revision; append publication follow-up separately against the same candidate identity. The public release record contains the manual operator authorization, not the private evidence or its digest. That receipt records explicit operator confirmation, not independent review or proof that every test was performed. Formal publication additionally requires the stable-package checks in the acceptance guide.
