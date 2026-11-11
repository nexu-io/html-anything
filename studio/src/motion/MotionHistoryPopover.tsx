import { Popover } from '@base-ui/react/popover';
import { useEffect, useRef, useState } from 'react';
import { useStudioShellContext } from '../contexts/StudioContext';
import { IconButton, Tooltip } from '../components/ui';
import { RemixIcon } from '../icons/RemixIcons';
import { useI18n } from '../i18n/I18n';
import { MotionHistoryPanel } from './MotionHistoryPanel';

export function MotionHistoryPopover() {
  const { t } = useI18n();
  const { projectId } = useStudioShellContext();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [projectId]);

  return <Popover.Root modal open={open} onOpenChange={setOpen}>
    <Tooltip label={t('Version history')}>
      <Popover.Trigger render={<IconButton ref={triggerRef} className="text-text-0" aria-label={t('Version history')}
        icon={<RemixIcon name="history-line" size={16} />} />} />
    </Tooltip>
    <Popover.Portal>
      <Popover.Backdrop className="fixed inset-0 z-140" />
      <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12}
        collisionAvoidance={{ side: 'none', align: 'shift' }} positionMethod="fixed" className="z-150">
        <Popover.Popup data-testid="history-popover" finalFocus={triggerRef} aria-describedby={undefined}
          className="hf-floating-motion flex h-[min(520px,var(--available-height))] w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border bg-surface text-text-1 shadow-menu outline-none">
          <div className="flex shrink-0 items-center justify-between px-3 py-2">
            <Popover.Title className="text-step-14 font-semibold">{t('Version history')}</Popover.Title>
            <Popover.Close render={<IconButton aria-label={t('Close')} icon={<RemixIcon name="close-line" size={16} />} />} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MotionHistoryPanel compact allowPinning={false} />
          </div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>;
}
