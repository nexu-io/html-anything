import { useEffect, useRef } from 'react';

/** Runs `report` once each time a notice goes from hidden to shown, however often it re-renders. */
export function useNoticeShown(visible: boolean, report: () => void) {
  const shown = useRef(false);
  const latest = useRef(report); latest.current = report;
  useEffect(() => {
    if (!visible) { shown.current = false; return; }
    if (shown.current) return;
    shown.current = true;
    latest.current();
  }, [visible]);
}
