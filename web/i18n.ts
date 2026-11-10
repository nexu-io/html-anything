import type { Locale, MessageValues, Translate } from '../studio/src/i18n/messages';

/** Update only interface labels; keep live previews, form values and copied instructions intact. */
export function localizeFragment(root: HTMLElement, initialLocale: Locale, initialTranslate: Translate) {
  let locale = initialLocale, translate = initialTranslate;
  const bindings = new WeakMap<Element, Map<string, () => void>>();
  const t: Translate = (message, values) => translate(message, values);
  function bind(node: HTMLElement, attribute: string, message: string, values?: MessageValues | (() => MessageValues)) {
    let entries = bindings.get(node);
    if (!entries) { entries = new Map(); bindings.set(node, entries); node.setAttribute('data-motion-i18n', ''); }
    const render = () => {
      const value = t(message, typeof values === 'function' ? values() : values);
      if (attribute) node.setAttribute(attribute, value); else node.textContent = value;
    };
    entries.set(attribute, render); render();
  }
  const text = (node: HTMLElement, message: string, values?: MessageValues | (() => MessageValues)) => bind(node, '', message, values);
  const attribute = (node: HTMLElement, name: string, message: string, values?: MessageValues | (() => MessageValues)) => bind(node, name, message, values);
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach(node => text(node, node.dataset.i18n!));
  root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach(node => attribute(node, 'aria-label', node.dataset.i18nAriaLabel!));
  return {
    t, text, attribute,
    get locale() { return locale; },
    setLanguage(nextLocale: Locale, nextTranslate: Translate) {
      locale = nextLocale; translate = nextTranslate;
      root.querySelectorAll('[data-motion-i18n]').forEach(node => bindings.get(node)?.forEach(render => render()));
    },
  };
}
export type FragmentI18n = ReturnType<typeof localizeFragment>;
