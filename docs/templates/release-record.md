# Motion candidate acceptance record

Keep the completed record and attachments internally. Only its SHA256 goes into the public publication workflow. Do not attach user material, credentials, internal URLs or this completed record to public artifacts.

## Frozen identity

- Package / exact version:
- Source full SHA / integration PR / review:
- Candidate workflow SHA / run ID / attempt / artifact expiry:
- TGZ filename / size / SHA256 / npm SHA512 integrity:
- Embedded application / manifest / npm lock / native lock hashes:
- Template environment / Resource / locale / catalog publication version:
- Supported OS / CPU / Node / npm / host versions:
- Acceptance owner / independent reviewer / release operator:
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
- Frozen record filename / SHA256 (hash the final file and retain those same bytes):

## Publication follow-up

- Publication run / npm exact version / registry hash and integrity:
- Native registry cold-install report per platform:
- Immutable R2 version / release-record / guide URL and verified hash:
- Default entry / previous entry / final publication phase:
- Failure, recovery or user feedback:

Append follow-up as a separate record linked to the frozen acceptance digest; do not edit the already-hashed approval file in place. Formal publication additionally requires the stable-package checks in the acceptance guide.
