import { WorkspaceStore } from '../workspace.ts';
import { ensureService } from '../preview.ts';
import { templateLibraryPreview } from '../shared/workspace-url.ts';

// Setup can prepare the page even when the current host has not refreshed MCP discovery.
// Starting the headless service never initializes a native project or opens an OS browser.
const service = await ensureService(new WorkspaceStore());
console.log(JSON.stringify(templateLibraryPreview(new URL(service.previewUrl).origin)));
