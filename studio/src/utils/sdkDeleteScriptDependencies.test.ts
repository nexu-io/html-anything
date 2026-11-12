// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
import { openComposition } from "@hyperframes/sdk";
import { sdkDeletePersist } from "./sdkCutover";
import { SCRIPT_DEPENDENCY_DELETE_MESSAGE } from "./deleteScriptDependencies";

vi.mock("../components/editor/manualEditingAvailability", () => ({
  STUDIO_SDK_CUTOVER_ENABLED: true,
  STUDIO_SDK_RESOLVER_SHADOW_ENABLED: false,
}));
vi.mock("./studioTelemetry", () => ({ trackStudioEvent: vi.fn() }));

it.each([false, true])("checks script dependencies in the latest SDK candidate (source changed: %s)", async (changed) => {
  const markup = '<html><body><div data-hf-id="hf-stage" data-hf-root><div data-hf-id="hf-box" id="box"></div></div></body></html>';
  const source = markup.replace('</body>', '<script>const box = document.getElementById("box"); box.style.color = "red";</script></body>');
  const original = changed ? markup : source;
  const live = await openComposition(original, { history: false });
  const before = live.serialize();
  const deps = {
    readProjectFile: vi.fn().mockResolvedValue(source),
    writeProjectFile: vi.fn(),
    editHistory: { recordEdit: vi.fn() },
    publishSession: vi.fn(),
    reloadPreview: vi.fn(),
  };
  try {
    const result = await sdkDeletePersist("hf-box", original, "index.html", live, deps);
    expect(result).toMatchObject({ status: "failed", error: new Error(SCRIPT_DEPENDENCY_DELETE_MESSAGE) });
    expect(deps.writeProjectFile).not.toHaveBeenCalled();
    expect(deps.editHistory.recordEdit).not.toHaveBeenCalled();
    expect(deps.publishSession).not.toHaveBeenCalled();
    expect(deps.reloadPreview).not.toHaveBeenCalled();
    expect(live.serialize()).toBe(before);
  } finally { live.dispose(); }
});
