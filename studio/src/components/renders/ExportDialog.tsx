import { Popover } from "@base-ui/react/popover";
import type { RefObject } from "react";
import { useI18n } from "../../i18n/I18n";
import { RemixIcon } from "../../icons/RemixIcons";
import { IconButton } from "../ui/IconButton";
import { RenderQueuePanel } from "./RenderQueuePanel";

/** Export settings and history share the native queue; closing does not cancel jobs. */
export function ExportDialog({ open, onOpenChange, triggerRef }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useI18n();
  return <Popover.Root modal open={open} onOpenChange={onOpenChange}>
    <Popover.Portal>
      <Popover.Backdrop className="fixed inset-0 z-140" />
      <Popover.Positioner anchor={triggerRef} side="bottom" align="end" sideOffset={8} collisionPadding={12}
        collisionAvoidance={{ side: "none", align: "shift" }} positionMethod="fixed" className="z-150">
      <Popover.Popup data-testid="export-dialog" finalFocus={triggerRef} aria-describedby={undefined}
        className="hf-floating-motion flex max-h-[var(--available-height)] w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border bg-surface text-text-1 shadow-menu outline-none">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <Popover.Title className="text-step-14 font-semibold">{t("Export")}</Popover.Title>
          <Popover.Close render={<IconButton aria-label={t("Close")} icon={<RemixIcon name="close-line" size={16} />} />} />
        </div>
        <div className="flex min-h-0 flex-col overflow-y-auto"><RenderQueuePanel /></div>
      </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>;
}
