# OpenMotion repository and release activation

OpenMotion is the application on `main` in `nexu-io/openmotion`. Daily integration and manual release operations continue on `feature/motion`; the default branch remains `main`. The former HTML Anything application remains available on [legacy](https://github.com/nexu-io/openmotion/tree/legacy).

The default-branch cutover carries the integrated Motion workflows, helpers, templates and tests. It replaces the older registration-only copies on main. A push or merge runs validation; it does not publish a package, advance npm tags or write release storage.

## Repository and release identity

The repository was renamed to `nexu-io/openmotion` on 2026-11-11, retaining repository ID `1235403234`, Git history and the `main` default branch. Repository guards, installation URLs and generated package links use the new address. Local clones should update their origin URL. Historical candidate receipts retain the former repository name and remain valid only through the current repository's authenticated artifact lookup and digest verification; new manual operations require `nexu-io/openmotion`.

Before the next npm publication, a package maintainer must verify the trusted publisher for `@openmotion/app` in npm:

| Setting | Value |
| --- | --- |
| Organization | `nexu-io` |
| Repository | `openmotion` |
| Workflow | `motion-publish-test.yml` |
| Environment | Blank |
| Permissions | npm publish and npm dist-tag |

The repository rename does not update npm trusted-publisher configuration. A package maintainer must set the repository to `openmotion` in npm before the next publication and confirm both publish and dist-tag permissions. Existing published package bytes, versions and tags are unchanged by the rename.

Existing R2 secrets and variables stay with the same GitHub repository; never copy their values into source. Only the authorized publication/storage jobs receive publication credentials.

## Manual operations

Use the [release workflow manual](release-workflows.md) for candidate building, exact-byte publication, native installation checks and snapshot recovery. Select `feature/motion` in **Run workflow**. Keep candidate validation, target-machine installation, real Agent creation and human audiovisual acceptance separate.

Main and repository-name changes do not authorize npm publication or storage writes. Historical registration began with [PR #222](https://github.com/nexu-io/openmotion/pull/222); the current integrated source and workflow manual supersede those registration-only instructions.
