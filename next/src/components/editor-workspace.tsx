"use client";

import { useEffect, useRef, useState } from "react";
import { ConvertChip } from "@/components/convert-chip";
import { EditorPane } from "@/components/editor-pane";
import { HistoryPane } from "@/components/history-pane";
import { PreviewPane } from "@/components/preview-pane";
import { SettingsModal, type SectionId } from "@/components/settings-modal";
import { TasksSidebar } from "@/components/tasks-sidebar";
import { Toolbar } from "@/components/toolbar";
import { WelcomeModal } from "@/components/welcome-modal";
import { useT, type DictKey } from "@/lib/i18n";
import { useStore, type AgentInfo } from "@/lib/store";
import type { SaveState } from "@/lib/use-project-autosave";

export type ProjectMode = {
  projectId: string;
  saveState: SaveState;
  canUnregister: boolean;
  onRetry: () => void;
  onUnregister: () => void;
};

export function EditorWorkspace({ projectMode }: { projectMode?: ProjectMode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const welcomeAck = useStore((s) => s.welcomeAck);
  const selectedAgent = useStore((s) => s.selectedAgent);
  const setAgents = useStore((s) => s.setAgents);
  const locale = useStore((s) => s.locale);
  const layoutMode = useStore((s) => s.layoutMode);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<
    SectionId | undefined
  >(undefined);
  const [deployConfigRev, setDeployConfigRev] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Detect agents on mount so the toolbar's agent chip can resolve the
  // persisted `selectedAgent` to a label without waiting for the user to
  // open Settings or Welcome. Without this, after a hard reload the chip
  // briefly (or permanently) shows "Select agent" even though selection
  // is intact in localStorage.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agents", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { agents: AgentInfo[] };
        if (!cancelled) setAgents(data.agents);
      } catch {
        // Settings / Welcome modals will retry on open.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, setAgents]);

  // Keep <html lang="…"> in sync with the user's locale so screen readers
  // and browser features (autotranslate, hyphenation) pick the right language.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  useEffect(() => {
    if (!hydrated) return;
    if (!welcomeAck || !selectedAgent) setWelcomeOpen(true);
  }, [hydrated, welcomeAck, selectedAgent]);

  return (
    <main className="relative flex h-screen flex-col">
      <Toolbar
        iframeRef={iframeRef}
        onOpenAgentPicker={() => setSettingsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onRequestConfigureDeploy={() => {
          setSettingsInitialSection("deploy");
          setSettingsOpen(true);
        }}
        deployConfigRev={deployConfigRev}
      />
      {projectMode && <ProjectBar projectMode={projectMode} />}
      <div
        className="flex flex-1 min-h-0"
        style={{ borderTop: "1px solid var(--line-faint)" }}
      >
        {!projectMode && <TasksSidebar />}
        <HistoryPane />
        <div className="relative flex flex-1 min-w-0">
          {layoutMode !== "preview" && (
            <section
              className="flex min-w-0 flex-1 basis-0 flex-col"
              style={
                layoutMode === "split"
                  ? { borderRight: "1px solid var(--line-faint)" }
                  : undefined
              }
            >
              <EditorPane
                projectId={projectMode?.projectId}
                localAutosaveEnabled={!projectMode}
              />
            </section>
          )}
          {layoutMode !== "editor" && (
            <section className="flex min-w-0 flex-1 basis-0 flex-col">
              <PreviewPane
                iframeRef={iframeRef}
                assetBaseHref={
                  projectMode
                    ? `/api/projects/${encodeURIComponent(projectMode.projectId)}/`
                    : undefined
                }
              />
            </section>
          )}
          <ConvertChip />
        </div>
      </div>
      {welcomeOpen && <WelcomeModal onClose={() => setWelcomeOpen(false)} />}
      {settingsOpen && (
        <SettingsModal
          initialSection={settingsInitialSection}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsInitialSection(undefined);
            setDeployConfigRev((r) => r + 1);
          }}
        />
      )}
    </main>
  );
}

const SAVE_STATE_KEYS: Record<SaveState, DictKey> = {
  idle: "project.save.saved",
  saving: "project.save.saving",
  saved: "project.save.saved",
  failed: "project.save.failed",
};

function ProjectBar({ projectMode }: { projectMode: ProjectMode }) {
  const projectName = useStore(
    (state) =>
      state.tasks.find(
        (task) => task.serverProjectId === projectMode.projectId,
      )?.name,
  );
  const t = useT();
  const failed = projectMode.saveState === "failed";

  return (
    <div
      className="flex min-h-10 items-center justify-between gap-4 px-5 py-2 text-xs"
      style={{ background: "var(--bone)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="min-w-0 truncate font-medium text-[var(--ink)]">
          {projectName ?? projectMode.projectId}
        </span>
        <span className="text-[var(--ink-mute)]">
          {t("project.oneBrowserGuidance")}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          role="status"
          aria-live="polite"
          className={
            failed
              ? "text-[var(--red)]"
              : projectMode.saveState === "saving"
                ? "text-[var(--coral)] shimmer"
                : "text-[var(--green)]"
          }
        >
          {t(SAVE_STATE_KEYS[projectMode.saveState])}
        </span>
        {failed && (
          <button
            type="button"
            onClick={projectMode.onRetry}
            className="font-medium text-[var(--coral)] hover:underline"
          >
            {t("project.retry")}
          </button>
        )}
        <button
          type="button"
          onClick={projectMode.onUnregister}
          disabled={!projectMode.canUnregister}
          className="font-medium text-[var(--ink-mute)] hover:text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[var(--ink-mute)]"
        >
          {t("project.unregister")}
        </button>
      </div>
    </div>
  );
}
