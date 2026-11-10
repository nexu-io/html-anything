import { badge, button, codeEditor, field, note, readout, slot, tabs, tooltip } from "@open-motion/components";
import { setTheme, type Theme } from "@open-motion/theme";
import type { Artifact } from "@open-motion/workspace/contract";
import type { Client } from "../../api.js";
import type { Editor } from "../editor.js";
import { Exports } from "./exports.js";
import { workspaceLayout } from "./layout.js";
import { Studio } from "./studio.js";
import { Conversation } from "./workspace/conversation.js";
import { Navigation } from "./workspace/navigation.js";
export function workspace(root: HTMLElement, editor: Editor, client: Client) {
  const document = root.ownerDocument,
    shell = workspaceLayout(document),
    studioRoot = slot(document, "fill"),
    artifactTabs = slot(document, "header"),
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
  shell.editor.append(artifactTabs, studioRoot);
  root.replaceChildren(shell.element);
  let theme: Theme = "light",
    busy = false,
    disposed = false,
    message = "加载中",
    retry: (() => void) | undefined,
    file = "index.html",
    activity = 0,
    flight = Promise.resolve();
  const run = (action: () => Promise<void>, next?: () => Promise<void>) => {
    if (busy || disposed) return;
    const focused = document.activeElement,
      epoch = activity;
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
          if (editor.needsRefresh) retry = () => run(() => editor.retryRefresh());
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
      });
  };
  const enterSession = (title: string) => {
    let id = "";
    run(
      async () => {
        id = await editor.createSession(title || `新会话 ${editor.state.sessions.length + 1}`);
        navigation.created(title);
      },
      () => editor.openSession(id),
    );
  };
  const enterArtifact = (title: string) => {
    let artifact: Artifact;
    run(
      async () => {
        artifact = await editor.createArtifact(title);
        conversation.created(title);
      },
      () => editor.openArtifact(artifact),
    );
  };
  const navigation = new Navigation(shell.navigation, {
    create: enterSession,
    open: (id) => run(() => editor.openSession(id)),
    theme: () => {
      theme = theme === "light" ? "dark" : "light";
      render(message);
    },
  });
  const conversation = new Conversation(shell.conversation, {
    append: (text) =>
      run(async () => {
        await editor.append(text);
        conversation.appended(text);
      }),
    create: enterArtifact,
    rename: (title) =>
      run(async () => {
        await editor.rename(title);
        conversation.renamed();
      }),
    open: (artifact) => run(() => editor.openArtifact(artifact)),
  });
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
    file: (path) =>
      run(async () => {
        await editor.save();
        file = path;
        studio.setMode("source");
      }),
    start: () => (editor.session ? enterArtifact(`工程 ${editor.session.artifacts.length + 1}`) : enterSession("")),
  });
  const exports = new Exports(document, editor, client, (action) => run(action));
  shell.editor.append(exports.element);
  const projectTabs = tabs(document, {
    label: "产物",
    appearance: "pill",
    select: (id) => {
      const artifact = editor.session?.artifacts.find((a) => a.id === id);
      if (artifact) run(() => editor.openArtifact(artifact));
    },
  });
  const addProject = button(document, {
    label: "新建工程",
    icon: "plus",
    iconOnly: true,
    variant: "ghost",
    onClick: () => conversation.newProject(),
  });
  artifactTabs.append(projectTabs.element, addProject, badge(document, "产物类型", "Motion"));
  const title = slot(document, "title"),
    saved = badge(document, "保存状态", ""),
    state = badge(document, "操作状态", message),
    left = slot(document, "toolbar"),
    actions = slot(document, "toolbar");
  state.setAttribute("aria-live", "polite");
  left.append(title, saved);
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
    studio.sync(editor.project, busy || editor.unconfirmed);
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
      if (!busy && !editor.unconfirmed && editor.project) run(() => editor.save());
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
        editor.project &&
        (direction === "project_undo"
          ? editor.project.history.canUndo || editor.dirty || editor.drafts?.dirty()
          : editor.project.history.canRedo && !editor.dirty && !editor.drafts?.dirty())
      )
        run(() => editor.history(direction));
    }
  });
  function refreshHeader() {
    const blocked = busy || editor.unconfirmed,
      artifact = editor.session?.artifacts.find((a) => a.id === editor.project?.artifactId);
    title.textContent = artifact?.title ?? editor.session?.title ?? "创作工作区";
    saved.value = editor.dirty || editor.drafts?.dirty() ? "未保存" : "本地已保存";
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
    const blocked = busy || editor.unconfirmed;
    setTheme(root, theme);
    root.setAttribute("data-session-id", editor.state.selection.sessionId ?? "");
    root.setAttribute("data-artifact-id", editor.state.selection.artifactId ?? "");
    navigation.update(editor, blocked, theme === "dark");
    conversation.update(editor, blocked);
    addProject.disabled = blocked || !editor.session;
    projectTabs.update(
      (editor.session?.artifacts ?? []).map((a) => ({ id: a.id, label: a.title, icon: "film" as const })),
      editor.project?.artifactId ?? "",
      blocked,
    );
    if (!editor.project?.files.some((f) => f.path === file)) file = "index.html";
    source.setAttribute("aria-label", file);
    if (sourceLabel.firstElementChild) sourceLabel.firstElementChild.textContent = file;
    if (source.value !== editor.source(file)) source.value = editor.source(file);
    revision.textContent = editor.project?.revision ?? "尚未打开工程";
    refreshHeader();
    studio.sync(editor.project, blocked);
    exports.update(editor.project, blocked);
  }
  render("加载中");
  run(() => editor.load());
  let disposal: Promise<void> | undefined;
  return {
    dispose(): Promise<void> {
      if (disposal) return disposal;
      disposed = true;
      disposal = (async () => {
        await flight;
        await exports.dispose();
        await studio.dispose();
        conversation.dispose();
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
