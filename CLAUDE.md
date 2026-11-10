# Claude Code

Read and follow [AGENTS.md](AGENTS.md) before working in this repository. It is the shared source of instructions for all Agents.

## Candidate and publication controls

Follow [the release workflow manual](docs/release-workflows.md): separate manual candidate-build and test-publication entries, plus snapshot-only recovery. Download and accept the local tgz using candidate-install.md; keep completed acceptance.md private. The publication operator enters the accepted version and explicitly confirms acceptance, without manually copying hashes. No independent approval environment is enabled at this stage. Public candidates must use an exact reviewed source SHA integrated into `feature/motion`, a new test version and prod template defaults. Scan tracked source plus the outer npm tgz and inner application; preserve the positive distribution list and licenses. Keep candidate, native registry installation, real Agent creation and human acceptance evidence separate.

Publication uses the accepted candidate bytes, never a rebuild. Only the separately authorized manual test publication workflow may use npm OIDC or R2 credentials; validate candidate provenance and hashes first, archive immutable version records, and update the moving guide last. Archive-only work must not move tags or default entries. Never overwrite published versions, put private DEV data/internal acceptance material into public artifacts, or infer merge/publication authorization from green CI. Main registration, npm trust, main cutover and repository rename remain separate operations.
