import { useMvpEditor } from "./StudioHost";
import { useI18n } from '../i18n/I18n';
import { useEffect, useRef } from 'react';
import { mountConnection } from '../../../web/connect';
import connectionPage from '../../../web/connect.html?raw';
import { TemplateLibraryDialog } from './TemplateLibraryDialog';
import { MotionIcon } from './icons';
import '../../../web/connect.css';
import '../../../web/template-gallery.css';

type Props = { open: boolean; section?: 'setup' | 'templates'; busy: boolean; openingDisabled?: boolean; error: string; returnFocus?: HTMLElement | null; onClose: () => void; onOpen: (id: string) => void };

/** The original integration page lives inside one modal; Studio stays mounted beneath it. */
export function ConnectionDialog(props: Props) {
  const mvp = useMvpEditor();
  return mvp || props.section === 'templates' ? <TemplateLibraryDialog {...props} /> : <LegacyConnectionDialog {...props} />;
}

function LegacyConnectionDialog(props: Props) {
  const { t, locale } = useI18n();
  const mvp = useMvpEditor();
  const dialog = useRef<HTMLDialogElement>(null), root = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof mountConnection> | null>(null);
  const callbacks = useRef(props); callbacks.current = props;
  useEffect(() => {
    // Own this static fragment once. Workspace polling must not replace its live gallery DOM.
    root.current!.innerHTML = connectionPage;
    const mounted = mountConnection(root.current!, {
      t, locale,
      initialHost: new URLSearchParams(location.search).get('host'),
      close: () => { if (!callbacks.current.busy) callbacks.current.onClose(); },
      useTemplate: id => { if (!callbacks.current.busy && !callbacks.current.openingDisabled) callbacks.current.onOpen(id); },
    });
    if (mvp) {
      // Keep the shared gallery controller, previews and attribution links.
      // Only the integration/marketing sections are absent from the editor MVP.
      root.current!.querySelectorAll<HTMLElement>('.connect-header, .connect-main > :not(#templates)').forEach(section => {
        section.hidden = true;
        section.inert = true;
      });
    }
    controller.current = mounted;
    return () => { mounted.destroy(); controller.current = null; };
  }, [mvp]);
  useEffect(() => { controller.current?.setLanguage(locale, t); }, [locale, t, mvp]);
  useEffect(() => {
    // Capture the node: React clears the ref before passive unmount cleanup.
    const node = dialog.current;
    if (!props.open) { controller.current?.suspend(); node?.close(); return; }
    const returnFocus = props.returnFocus ?? document.activeElement;
    node?.showModal(); controller.current?.resume();
    if (props.section === 'templates') controller.current?.showTemplates();
    return () => {
      controller.current?.suspend(); node?.close();
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected && !returnFocus.matches(':disabled')) {
        returnFocus.focus({ preventScroll: true });
      }
    };
  }, [props.open, props.section, props.returnFocus]);
  return <dialog ref={dialog} className="connection-dialog" aria-labelledby="connection-dialog-title"
    onKeyDown={event => event.stopPropagation()}
    onCancel={event => { if (event.target !== dialog.current) return; event.preventDefault(); if (!props.busy) props.onClose(); }}>
    <div className="connection-dialog-bar">
      <h2 id="connection-dialog-title">{t(mvp ? "Template library" : "MCP connection · Templates")}</h2>
      <div className="connection-dialog-tools">
        <input id="template-search" className="ui-input connection-search" type="search" maxLength={200} placeholder={t("Search templates, creators, styles…")} aria-label={t("Search templates")} />
        <button id="connection-templates" className="ui-button ui-button--ghost ui-button--sm" onClick={() => controller.current?.showTemplates()}>{t("View all templates")}</button>
      </div>
      <button id="close-connections" className="ui-button ui-button--ghost ui-button--icon" aria-label={t(mvp ? "Close template library" : "Close MCP connection")} disabled={props.busy} onClick={props.onClose}><MotionIcon name="close" /></button>
    </div>
    {props.error ? <p className="connect-error" role="alert">{t(props.error)}</p> : props.busy && <p className="connect-progress" role="status"><span className="connect-progress-spinner" aria-hidden="true" />{t('Preparing editable project…')}</p>}
    <div id="connection-root" ref={root} />
  </dialog>;
}
