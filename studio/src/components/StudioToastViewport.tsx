import { FeedbackLayer } from './FeedbackLayer';
import { StudioToast } from './StudioToast';
import type { useToast } from '../hooks/useToast';

/** Out-of-flow feedback that remains above native dialogs without stealing focus. */
export function StudioToastViewport({ toasts, dismissToast }: Pick<ReturnType<typeof useToast>, 'toasts' | 'dismissToast'>) {
  if (!toasts.length) return null;
  return <FeedbackLayer><div className="pointer-events-none absolute top-16 left-1/2 z-91 flex w-[min(420px,calc(100%-48px))] -translate-x-1/2 flex-col items-center gap-2">
    {toasts.map(toast => <StudioToast key={toast.id} {...toast} onDismiss={() => dismissToast(toast.id)} />)}
  </div></FeedbackLayer>;
}
