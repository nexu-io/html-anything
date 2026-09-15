/**
 * Realm-safe editable-target check. `instanceof HTMLElement` fails when the
 * event target comes from an iframe's own window realm, so we check tagName
 * (a plain string) and isContentEditable (a plain boolean) directly.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).tagName !== "string") return false;
  const tag = (target as Element).tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || !!(target as HTMLElement).isContentEditable;
}
