/** Keep transient feedback above native dialogs as well as ordinary overlays.
 * Parent it inside the active modal so its dismiss controls are not inert. */
export function mountFeedbackLayer(element: HTMLElement): () => void {
  const doc = element.ownerDocument;
  const marker = doc.createComment('feedback origin');
  element.before(marker);
  const originalPopover = element.getAttribute('popover');
  const canPopover = typeof element.showPopover === 'function';
  let dialogs = Array.from(doc.querySelectorAll<HTMLDialogElement>('dialog[open]'));
  const isModal = (dialog: HTMLDialogElement) => {
    try { return dialog.matches(':modal'); } catch { return dialog.open; }
  };
  const refresh = () => {
    dialogs = dialogs.filter(dialog => dialog.isConnected && dialog.open);
    const parent = dialogs.filter(isModal).at(-1) ?? doc.body;
    if (canPopover && element.matches(':popover-open')) element.hidePopover();
    if (element.parentElement !== parent) parent.append(element);
    if (canPopover) element.showPopover();
  };
  if (canPopover) element.setAttribute('popover', 'manual');
  refresh();
  const observer = new MutationObserver(records => {
    let changed = false;
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof HTMLDialogElement) {
        const dialog = record.target;
        dialogs = dialogs.filter(item => item !== dialog);
        if (dialog.open) dialogs.push(dialog);
        changed = true;
      }
    }
    if (changed || dialogs.some(dialog => !dialog.isConnected)) refresh();
  });
  observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
  const onToggle = (event: Event) => {
    const target = event.target;
    // An unrelated popover opened later must not cover existing feedback.
    if (target instanceof HTMLElement && target !== element && !target.hasAttribute('data-feedback-layer')
      && target.hasAttribute('popover') && target.matches(':popover-open')) refresh();
  };
  element.setAttribute('data-feedback-layer', '');
  doc.addEventListener('toggle', onToggle, true);
  return () => {
    observer.disconnect();
    doc.removeEventListener('toggle', onToggle, true);
    if (canPopover && element.matches(':popover-open')) element.hidePopover();
    if (originalPopover === null) element.removeAttribute('popover');
    else element.setAttribute('popover', originalPopover);
    element.removeAttribute('data-feedback-layer');
    if (marker.parentNode) marker.replaceWith(element);
    else element.remove();
  };
}
