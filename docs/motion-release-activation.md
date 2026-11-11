# OpenMotion repository and release activation

OpenMotion is the application on `main` in `nexu-io/openmotion`, renamed from `nexu-io/html-anything`. Daily development and new manual release operations use `main`. Git history, existing issues, pull requests and historical candidate artifacts remain in the same GitHub repository. The former HTML Anything application remains on [legacy](https://github.com/nexu-io/openmotion/tree/legacy).

A push or merge runs validation; it does not publish a package, advance npm tags or update the public installation guide.

## Repository and release identity

New source-install commands, generated guide/package links and release guards use `nexu-io/openmotion`. New candidate builds and manual publication/recovery require `main`; application source must be integrated there. Frozen pre-rename candidate receipts keep their original repository/ref identity and remain verifiable against the same GitHub producer run and artifact hashes. They are not rewritten.

Before the next npm publication, a package maintainer must verify or update the external trusted publisher for `@openmotion/app` in npm:

| Setting | Value |
| --- | --- |
| Organization | `nexu-io` |
| Repository | `openmotion` |
| Workflow | `motion-publish-test.yml` |
| Environment | Blank |
| Permissions | npm publish and npm dist-tag |

Source changes do not update npm trust. Keep the workflow filename because it is part of the trusted-publisher identity. Existing R2 secrets and variables stay with the same GitHub repository; never copy their values into source. Only authorized publication/storage jobs receive publication credentials.

## Installation and onboarding rollout

The canonical installation-success reply contract and few-shots are in [docs/install.md](install.md#installation-success-reply). Installers return that contract plus bounded real template summaries in the installation turn. The Agent defaults to one confirmed template, offers three for an explicit comparison request when available, and creates the exact selected template only after consent. A known template plus an explicit creation request continues directly. Registration is separate from current-chat loading and invitation display.

To make those changes available through the website's existing short installation prompt, build and publish a new test candidate from `main`, then promote its matching DEV guide. The `/open-motion/dev/install.md` path and npm package name `@openmotion/app` stay the same; `dev` names the test channel, not the Git branch. Stable publication uses the stable guide separately. Never point a public guide at an unpublished version or claim that a source-only change has reached installed hosts.

Use the [release workflow manual](release-workflows.md) for exact-byte publication, native installation checks and snapshot recovery. Keep candidate validation, target-machine installation, real host invitation/creation and human audiovisual acceptance separate. Repository migration and green CI do not authorize publication.
