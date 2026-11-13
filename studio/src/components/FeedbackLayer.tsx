import { useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { mountFeedbackLayer } from '../../../web/feedback-layer';

/** The container may move between native dialogs; React retains portal ownership.
 * Its layout lives in `components.css` so the class the source claims is a real rule. */
export function FeedbackLayer({ children }: { children: ReactNode }) {
  const [container] = useState(() => {
    const node = document.createElement('div');
    node.className = 'motion-feedback-layer';
    return node;
  });
  useLayoutEffect(() => {
    document.body.append(container);
    const unmount = mountFeedbackLayer(container);
    return () => { unmount(); container.remove(); };
  }, [container]);
  return createPortal(children, container);
}
