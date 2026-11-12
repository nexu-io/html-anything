import { badge, button, codeEditor, field, note, readout, slot, tooltip } from "@open-motion/components";
import { setTheme, type Theme } from "@open-motion/theme";
import type { Client } from "../../api.js";
import type { Editor } from "../editor.js";
import { observeWorkspace } from "../observe.js";
import { Exports } from "./exports.js";
import { workspaceLayout } from "./layout.js";
import { Studio } from "./studio.js";
import { Archives } from "./workspace/archives.js";
import { Creation } from "./workspace/create.js";
import { Navigation } from "./workspace/navigation.js";
import { WorkspaceSync } from "./workspace/sync.js";
export function workspace(root: HTMLElement, editor: Editor, client: Client, entry?: string) {
  const document = root.ownerDocument,
    shell = workspaceLayout(document),
    studioRoot = slot(document, "fill"),
    sourceView = document.createElement("section"),
    source = codeEditor(document),
    sourceLabel = field(document, "index.html", source),
    revision = readout(document, "revision", ""),
    caption = note(document, "工程源码 · ⌘/Ctrl S 保存"),
    body = slot(document, "content"),
    sourceActions = slot(document, "toolbar");
  sourceView.setAttribute("aria-label", "工程源码");
  body.append(caption, sourceLabel, revision, sourceActions);
  sourceView.append(body);
  shell.editor.append(studioRoot);
  root.replaceChildren(shell.element);
  let theme: Theme = "light",
    busy = false,
    disposed = false,
    message = "加载中",
    retry: (() => void) | undefined,
    file = "index.html",
    activity = 0,
    operations = 0,
    requestedEntry: string | undefined,
    flight = Promise.resolve();
  const run = (action: () => Promise<void>, next?: () => Promise<void>) => {
    if (busy || disposed) return;
    const focused = document.activeElement,
      epoch = activity;
    operations++;
    busy = true;
    retry = () => run(action, next);
    render("处理中");
    flight = action()
      .then(
        () => {
          retry = undefined;
          busy = false;
          if (!disposed) {
            if (next) run(next);
            else render("就绪");
          }
        },
        (error) => {
          busy = false;
          if (editor.needsRefresh && !creation.pending) retry = () => run(() => editor.retryRefresh());
          if (!disposed) render((error as Error).message);
        },
      )
      .then(() => {
        if (
          !disposed &&
          epoch === activity &&
          document.activeElement === document.body &&
          focused instanceof (document.defaultView?.HTMLElement ?? HTMLElement) &&
          focused.isConnected
        )
          focused.focus();
        if (!disposed && requestedEntry !== undefined && !editor.unconfirmed && !creation.pending) {
          const target = requestedEntry;
          requestedEntry = undefined;
          run(() => editor.load(target || undefined));
        }
      });
    return flight;
  };
  const onEntry = () => {
    requestedEntry = document.defaultView?.location.hash ?? "";
    if (!busy && !editor.unconfirmed && !creation.pending) {
      const target = requestedEntry;
      requestedEntry = undefined;
      run(() => editor.load(target || undefined));
    }
  };
  if (entry !== undefined) document.defaultView?.addEventListener("hashchange", onEntry);
  const synchronization = new WorkspaceSync(document, editor, run);
  shell.editor.prepend(synchronization.element);
  const observer = observeWorkspace(editor, {
    available: () => !busy && !disposed && !creation.pending,
    generation: () => operations,
    changed: () => render(message),
    status: (value) => synchronization.status(value),
  });
  const creation = new Creation(document, editor, client, run);
  const navigation = new Navigation(document, client, {
    open: async (artifact) => {
      let opened = false;
      await run(async () => {
        await editor.openArtifact(artifact);
        opened = true;
      });
      if (!opened) throw new Error(message);
    },
    create: () => creation.open(newProject),
    theme: () => {
      theme = theme === "light" ? "dark" : "light";
      render(message);
    },
  });
  const archives = new Archives(document, editor, client, run);
  shell.element.append(navigation.view.element, creation.view.element);
  const studio = new Studio(studioRoot, editor, client, run, {
    source: sourceView,
    sourceInput: () => source,
    context: (path) => {
      if (file !== path) {
        file = path;
        render(message);
      }
    },
    changed: () => refreshHeader(),
    file: (path) => {
      file = path;
      studio.setMode("source");
    },
    start: () => creation.open(newProject),
  });
  const exports = new Exports(document, editor, client, (action) => run(action));
  shell.editor.append(exports.element, archives.element);
  const newProject = button(document, {
    label: "新建项目",
    icon: "plus",
    compact: true,
    onClick: () => creation.open(newProject),
  });
  const title = slot(document, "title"),
    saved = badge(document, "保存状态", ""),
    state = badge(document, "操作状态", message),
    left = slot(document, "toolbar"),
    actions = slot(document, "toolbar");
  state.setAttribute("aria-live", "polite");
  const navigationToggle = button(document, {
    label: "打开项目列表",
    icon: "sidebar",
    iconOnly: true,
    variant: "ghost",
    onClick: () => navigation.open(navigationToggle),
  });
  navigationToggle.setAttribute("aria-haspopup", "dialog");
  navigationToggle.setAttribute("aria-expanded", "false");
  left.append(navigationToggle, title, saved);
  actions.append(newProject);
  shell.header.append(left, actions);
  const undo = button(document, {
      label: "撤销",
      icon: "undo",
      iconOnly: true,
      variant: "ghost",
      onClick: () => run(() => editor.history("project_undo")),
    }),
    redo = button(document, {
      label: "重做",
      icon: "redo",
      iconOnly: true,
      variant: "ghost",
      onClick: () => run(() => editor.history("project_redo")),
    }),
    refresh = button(document, {
      label: "刷新",
      icon: "refresh",
      iconOnly: true,
      variant: "ghost",
      onClick: () => run(() => editor.load()),
    }),
    save = button(document, {
      label: "保存",
      icon: "save",
      compact: true,
      primary: true,
      onClick: () => run(() => editor.save()),
    }),
    again = button(document, { label: "重试", icon: "refresh", compact: true, onClick: () => retry?.() });
  const hints = [
    tooltip(document, undo, "撤销 · ⌘/Ctrl Z"),
    tooltip(document, redo, "重做 · ⌘/Ctrl Shift Z"),
    tooltip(document, refresh, "刷新工作区"),
  ];
  actions.append(...hints.map((h) => h.element), save, again, state);
  const discard = button(document, {
    label: "放弃本地修改并刷新",
    icon: "refresh",
    compact: true,
    onClick: () => run(() => editor.discard()),
  });
  sourceActions.append(discard);
  source.oninput = () => {
    editor.editFile(file, source.value);
    refreshHeader();
    studio.sync(editor.project, busy || editor.unconfirmed || creation.pending || !!editor.incoming);
  };
  const interacted = () => {
    activity++;
  };
  shell.element.addEventListener("pointerdown", interacted);
  shell.element.addEventListener("keydown", interacted);
  shell.element.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.isComposing) return;
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!busy && !editor.unconfirmed && !creation.pending && !editor.incoming && editor.project)
        run(() => editor.save());
    }
    if (
      event.key.toLowerCase() === "z" &&
      !(event.target instanceof (document.defaultView?.HTMLInputElement ?? HTMLInputElement)) &&
      !(event.target instanceof (document.defaultView?.HTMLTextAreaElement ?? HTMLTextAreaElement))
    ) {
      event.preventDefault();
      const direction = event.shiftKey ? "project_redo" : "project_undo";
      if (
        !busy &&
        !editor.unconfirmed &&
        !creation.pending &&
        !editor.incoming &&
        editor.project &&
        (direction === "project_undo"
          ? editor.project.history.canUndo || editor.dirty || editor.drafts?.dirty()
          : editor.project.history.canRedo && !editor.dirty && !editor.drafts?.dirty())
      )
        run(() => editor.history(direction));
    }
  });
  function refreshHeader() {
    const blocked = busy || editor.unconfirmed || creation.pending || !!editor.incoming,
      artifact = editor.session?.artifacts.find((a) => a.id === editor.project?.artifactId);
    title.textContent = artifact?.title ?? editor.session?.title ?? "Open Motion";
    saved.value = !editor.project ? "尚无项目" : editor.dirty || editor.drafts?.dirty() ? "未保存" : "本地已保存";
    state.value = message;
    undo.disabled =
      blocked || !editor.project || !(editor.project.history.canUndo || editor.dirty || editor.drafts?.dirty());
    redo.disabled = blocked || !editor.project?.history.canRedo || editor.dirty || !!editor.drafts?.dirty();
    refresh.disabled = blocked;
    save.disabled = blocked || !editor.project;
    again.hidden = !retry;
    again.disabled = busy;
    source.disabled = !editor.project;
    source.readOnly = blocked || !!editor.drafts?.dirty();
    discard.disabled = blocked;
  }
  function render(next: string) {
    if (disposed) return;
    message = next;
    const blocked = busy || editor.unconfirmed || creation.pending || !!editor.incoming;
    setTheme(root, theme);
    root.setAttribute("data-session-id", editor.state.selection.sessionId ?? "");
    root.setAttribute("data-artifact-id", editor.state.selection.artifactId ?? "");
    synchronization.update(busy || editor.unconfirmed || creation.pending);
    navigation.update(editor, blocked, theme === "dark", busy);
    creation.update(busy, blocked, message);
    archives.update(editor, blocked);
    newProject.disabled = busy || (blocked && !creation.pending);
    if (!editor.sources.some((f) => f.path === file)) file = "index.html";
    source.setAttribute("aria-label", file);
    if (sourceLabel.firstElementChild) sourceLabel.firstElementChild.textContent = file;
    if (source.value !== editor.source(file)) source.value = editor.source(file);
    revision.textContent = editor.project?.revision ?? "尚未打开工程";
    refreshHeader();
    studio.sync(editor.project, blocked);
    exports.update(editor.project, blocked);
  }
  render("加载中");
  run(() => editor.load(entry || undefined));
  let disposal: Promise<void> | undefined;
  return {
    dispose(): Promise<void> {
      if (disposal) return disposal;
      disposed = true;
      document.defaultView?.removeEventListener("hashchange", onEntry);
      disposal = (async () => {
        await observer.close();
        await flight;
        await exports.dispose();
        await creation.dispose();
        await navigation.dispose();
        await studio.dispose();
        archives.dispose();
        for (const hint of hints) hint.dispose();
        shell.element.remove();
      })().catch((error) => {
        disposal = undefined;
        throw error;
      });
      return disposal;
    },
  };
}
