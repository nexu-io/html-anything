# OpenMotion repository and release activation

OpenMotion is the application on `main` in `nexu-io/html-anything`. Daily integration and manual release operations continue on `feature/motion`; the default branch remains `main`. The former HTML Anything application remains available on [legacy](https://github.com/nexu-io/html-anything/tree/legacy).

The default-branch cutover carries the integrated Motion workflows, helpers, templates and tests. It replaces the older registration-only copies on main. A push or merge runs validation; it does not publish a package, advance npm tags or write release storage.

## Repository and release identity

The repository remains `nexu-io/html-anything`. Repository guards, installation URLs and generated package links retain that address. Repository renaming is a separate administrator action.

Before the next npm publication, a package maintainer must verify the trusted publisher for `@openmotion/app` in npm:

| Setting | Value |
| --- | --- |
| Organization | `nexu-io` |
| Repository | `html-anything` |
| Workflow | `motion-publish-test.yml` |
| Environment | Blank |
| Permissions | npm publish and npm dist-tag |

The main-branch cutover does not change npm trust, published packages or tags. If the repository is renamed later, update its source URLs, release guards and npm trusted-publisher setting together before the next publication.

Existing R2 secrets and variables stay with the same GitHub repository; never copy their values into source. Only the authorized publication/storage jobs receive publication credentials.

## Manual operations

Use the [release workflow manual](release-workflows.md) for candidate building, exact-byte publication, native installation checks and snapshot recovery. Select `feature/motion` in **Run workflow**. Keep candidate validation, target-machine installation, real Agent creation and human audiovisual acceptance separate.

Main and repository-name changes do not authorize npm publication or storage writes. Historical registration began with [PR #222](https://github.com/nexu-io/html-anything/pull/222); the current integrated source and workflow manual supersede those registration-only instructions.
