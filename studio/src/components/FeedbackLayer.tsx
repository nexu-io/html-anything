import { useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { mountFeedbackLayer } from '../../../web/feedback-layer';

/** The container may move between native dialogs; React retains portal ownership. */
export function FeedbackLayer({ children }: { children: ReactNode }) {
  const [container] = useState(() => {
    const node = document.createElement('div');
    node.className = 'motion-feedback-layer';
    Object.assign(node.style, {
      position: 'fixed', inset: '0', margin: '0', padding: '0', border: '0',
      width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none',
      background: 'transparent', overflow: 'visible', pointerEvents: 'none', zIndex: '2147483647',
    });
    return node;
  });
  useLayoutEffect(() => {
    document.body.append(container);
    const unmount = mountFeedbackLayer(container);
    return () => { unmount(); container.remove(); };
  }, [container]);
  return createPortal(children, container);
}
