// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore, type TimelineElement } from "../../player/store/playerStore";
import { useAssetPreviewStore } from "../../utils/assetPreviewStore";
import { AssetCard } from "./AssetCard";
import { AudioRow } from "./AudioRow";
import { InlineAssetRename } from "./InlineAssetRename";
import { I18nProvider } from "../../i18n/I18n";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = null;
  }
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
  useAssetPreviewStore.getState().clearPreviewAsset();
  vi.restoreAllMocks();
});

function mount(node: React.ReactElement): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root?.render(node);
  });
  return host;
}

function clip(input: Partial<TimelineElement> & { id: string; src: string }): TimelineElement {
  return { tag: "div", start: 0, duration: 5, track: 0, ...input };
}

describe("inline asset rename", () => {
  function setup(value: string) {
    const rename = vi.fn();
    const done = vi.fn();
    const host = mount(<InlineAssetRename asset="assets/video.mp4" onRename={rename} onDone={done} />);
    const input = host.querySelector("input")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return { input, host, rename, done };
  }
  it("saves on blur in the original directory", () => {
    const { input, rename, done } = setup("new.mp4");
    act(() => input.blur());
    expect(rename).toHaveBeenCalledWith("assets/video.mp4", "assets/new.mp4");
    expect(done).toHaveBeenCalledOnce();
  });
  it("commits Enter once even if followed by blur", () => {
    const { input, rename } = setup("new.mp4");
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    act(() => input.blur());
    expect(rename).toHaveBeenCalledOnce();
  });
  it("cancels with Escape and ignores its subsequent blur", () => {
    const { input, rename, done } = setup("new.mp4");
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    act(() => input.blur());
    expect(rename).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledOnce();
  });
  it("restores empty names and blocks path traversal", () => {
    const empty = setup("   ");
    act(() => empty.input.blur());
    expect(empty.rename).not.toHaveBeenCalled();
    expect(empty.done).toHaveBeenCalledOnce();
    act(() => root?.unmount());
    root = null;
    const invalid = setup("../other.mp4");
    act(() => invalid.input.blur());
    expect(invalid.rename).not.toHaveBeenCalled();
    expect(invalid.done).not.toHaveBeenCalled();
    expect(invalid.input.getAttribute("aria-invalid")).toBe("true");
  });
});

/** Simulate a drag-free click: pointerdown + pointerup at the same point. */
function clickCard(host: HTMLElement): void {
  const card = host.querySelector('[draggable="true"]');
  if (!card) throw new Error("Expected a draggable card root");
  const PointerCtor = (window as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
  act(() => {
    card.dispatchEvent(new PointerCtor("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
    card.dispatchEvent(new PointerCtor("pointerup", { bubbles: true, clientX: 5, clientY: 5 }));
  });
}

describe("AssetCard click behavior", () => {
  const cardProps = {
    projectId: "p1",
    onCopy: vi.fn(),
    copyFeedback: null,
  };

  it.each([['zh-CN', '已使用'], ['en', 'In use']] as const)("labels only referenced assets as in use in %s", (locale, label) => {
    const host = mount(<I18nProvider initialLocale={locale}>
      <AssetCard {...cardProps} asset="assets/used.png" used />
      <AssetCard {...cardProps} asset="assets/unused.png" used={false} />
      <AudioRow {...cardProps} asset="assets/music.mp3" used />
    </I18nProvider>);
    const rows = [...host.querySelectorAll('[draggable="true"]')];
    expect(rows[0].textContent).toContain(label);
    expect(rows[1].textContent).not.toContain(label);
    expect(rows[2].textContent).toContain(label);
    expect(host.textContent).not.toContain('Added');
    expect(host.textContent).not.toContain('已添加');
  });

  it("clears an open preview overlay when clicking an already-added asset (reveal branch)", () => {
    usePlayerStore.getState().setElements([clip({ id: "img1", src: "assets/logo.png" })]);
    // Preview overlay is open on ANOTHER asset — the reveal must dismiss it,
    // or it stays stuck over the canvas while the timeline reveals the clip.
    useAssetPreviewStore.getState().setPreviewAsset("assets/other.png", "p1");

    const host = mount(<AssetCard {...cardProps} asset="assets/logo.png" used />);
    clickCard(host);

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(usePlayerStore.getState().selectedElementId).toBe("img1");
  });

  it("opens the preview overlay for a not-yet-added asset", () => {
    const host = mount(<AssetCard {...cardProps} asset="assets/logo.png" used={false} />);
    clickCard(host);

    expect(useAssetPreviewStore.getState().previewAsset).toBe("assets/logo.png");
    expect(useAssetPreviewStore.getState().previewProjectId).toBe("p1");
  });
});

describe("AudioRow click behavior", () => {
  const rowProps = {
    projectId: "p1",
    onCopy: vi.fn(),
    copyFeedback: null,
  };

  it("distinguishes matching audio names by their full filename without repeating Audio", () => {
    const names = ["qa.mp3", "qa.wav", "qa.ogg", "qa (2).m4a", "qa.aac", "qa.flac"];
    const host = mount(<>{names.map(name => <AudioRow key={name} {...rowProps} asset={`assets/${name}`} used={false} meta={{ duration: 2 }} />)}</>);
    const rows = [...host.querySelectorAll('.motion-audio-row')];
    expect(rows).toHaveLength(names.length);
    rows.forEach((row, index) => {
      expect(row.textContent).toBe(`${names[index]}2s`);
      expect(row.getAttribute('aria-label')).toContain(names[index]);
      expect(row.querySelector('button')?.getAttribute('aria-label')).toContain(names[index]);
    });
  });

  it("clears an open preview overlay when clicking an already-added audio asset (reveal branch)", () => {
    usePlayerStore
      .getState()
      .setElements([clip({ id: "bgm1", tag: "audio", src: "assets/bgm.mp3" })]);
    useAssetPreviewStore.getState().setPreviewAsset("assets/other.mp3", "p1");

    const host = mount(<AudioRow {...rowProps} asset="assets/bgm.mp3" used />);
    clickCard(host);

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(usePlayerStore.getState().selectedElementId).toBe("bgm1");
  });

  it("opens the preview overlay for a not-yet-added audio asset", () => {
    const host = mount(<AudioRow {...rowProps} asset="assets/bgm.mp3" used={false} />);
    clickCard(host);

    expect(useAssetPreviewStore.getState().previewAsset).toBe("assets/bgm.mp3");
  });
});

it('renames audio in its caption, saves on blur, and does not activate preview while typing', () => {
  const rename = vi.fn();
  const host = mount(<AudioRow projectId="p1" asset="assets/music.wav" used={false} onCopy={vi.fn()} copyFeedback={null} onRename={rename} />);
  act(() => host.querySelector<HTMLButtonElement>('.motion-audio-menu-button')!.click());
  act(() => Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(b => b.textContent === 'Rename')!.click());
  expect(document.querySelector('[role="menu"]')).toBeNull();
  const input = host.querySelector('input')!;
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('music.wav');
  act(() => {
    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'music 111.wav');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
  act(() => input.blur());
  expect(rename).toHaveBeenCalledWith('assets/music.wav', 'assets/music 111.wav');
  expect(host.querySelector('input')).toBeNull();
});
