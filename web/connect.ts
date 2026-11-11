import { integrationHost, hostNames, hostDescriptions, setupPrompt, manualConnection, agentGuide, apiDiscoveryCommand } from '../shared/integration';
import type { IntegrationInfo } from '../shared/integration';
import { mountTemplates } from './template-gallery';
import { localizeFragment } from './i18n';
import type { Locale, Translate } from '../studio/src/i18n/messages';

export function mountConnection(root: HTMLElement, options: { close: () => void; useTemplate: (id: string) => void; initialHost?: string | null; t: Translate; locale: Locale }) {
  const language = localizeFragment(root, options.locale, options.t), { t } = language;
  const element = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>('#' + id)!;
  let host = integrationHost(options.initialHost ?? null), info: IntegrationInfo | null = null;
  let checking = false;
  let feedbackTimer: ReturnType<typeof setTimeout>;
  const copiedButtons = new Map<HTMLButtonElement, Node[]>();
  let galleryController: ReturnType<typeof mountTemplates> | undefined;
  const lifetime = new AbortController();
  const blocked = () => host === 'chatgpt';

  function glyph(name: string) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ui-icon'); svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '/web/design-system/icons.svg#icon-' + name); svg.append(use); return svg;
  }
  function buttonLabel(button: HTMLButtonElement, text: string, icon: string) {
    const label = document.createElement('span'); language.text(label, text); button.replaceChildren(glyph(icon), label);
  }
  function resetCopied() {
    copiedButtons.forEach((nodes, button) => button.replaceChildren(...nodes)); copiedButtons.clear();
    clearTimeout(feedbackTimer); element('connect-feedback').classList.remove('is-visible');
  }
  async function copy(value: string, label: string, button?: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(value); resetCopied();
      if (button) { copiedButtons.set(button, [...button.childNodes]); buttonLabel(button, 'Copied', 'check'); }
      language.text(element('connect-feedback'), '{label} copied. Paste it into {host}.', () => ({ label: t(label), host: hostNames[host] }));
      element('connect-feedback').classList.add('is-visible'); feedbackTimer = setTimeout(resetCopied, 3000);
    } catch {
      element<HTMLTextAreaElement>('copy-fallback').value = value;
      element<HTMLDialogElement>('copy-dialog').showModal();
      element<HTMLTextAreaElement>('copy-fallback').focus(); element<HTMLTextAreaElement>('copy-fallback').select();
    }
  }
  function scrollTo(id: string) {
    const target = element(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  root.querySelectorAll<HTMLButtonElement>('[data-close-connect]').forEach(button => button.onclick = options.close);
  root.querySelectorAll<HTMLButtonElement>('[data-scroll]').forEach(button => button.onclick = () => scrollTo(button.dataset.scroll!));
  element('close-copy').onclick = () => element<HTMLDialogElement>('copy-dialog').close();
  element('close-guide').onclick = () => element<HTMLDialogElement>('guide-dialog').close();

  function renderHost() {
    const primary = host === 'chatgpt' ? 'mcp' : host;
    element('command-host').textContent = hostNames[host];
    language.text(element('connect-title'), 'Create videos with OpenDesign, right in {host}.', { host: hostNames[host] });
    language.text(element('setup-step-description'), 'Start a new conversation in {host}.', { host: hostNames[host] });
    language.text(element('host-description'), hostDescriptions[host]);
    language.text(element('setup-action'), blocked() ? "Connection requirements · " : "Copy this instruction and send it to ");
    element('setup-frequency').hidden = blocked(); element('setup-steps').hidden = blocked();
    language.text(element('template-intro'), blocked()
      ? "Browse templates and references. Choose an available local client when you are ready to send an instruction to your Agent."
      : 'Find a video you like, copy its instruction to {host}, and start creating.', { host: hostNames[host] });
    root.querySelectorAll<HTMLButtonElement>('[data-host]').forEach(button => {
      const selected = button.dataset.host === primary;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    element('host-panel').setAttribute('aria-labelledby', `host-${primary}`);
    element('other-hosts').hidden = primary !== 'mcp';
    root.querySelectorAll<HTMLButtonElement>('[data-other-host]').forEach(button => {
      const selected = button.dataset.otherHost === host;
      button.setAttribute('aria-pressed', String(selected)); button.classList.toggle('ui-button--ghost', !selected);
    });
    element('host-unavailable').hidden = !blocked();
    element<HTMLAnchorElement>('download-config').href = `/connect/config?host=${host}`;
    element('download-config').hidden = !info || blocked();
    for (const id of ['copy-setup', 'copy-config', 'copy-preview-template']) element<HTMLButtonElement>(id).disabled = !info || blocked();
    language.text(element('setup-prompt'), info ? setupPrompt(info, host) : "Connection address unavailable. Check the workspace service and try again.");
    language.text(element('manual-config'), info ? manualConnection(info, host) : "Reconnect to the workspace to view the configuration.");
    language.text(element('config-description'), host === 'deepseek' ? "Add this plugin entry to your Harness configuration, keeping your existing plugins." : host === 'chatgpt' ? "This workspace uses local stdio. A remote MCP service is not available yet." : "Use this configuration to connect, keeping your existing services.");
    language.text(element('connection-help'), host === 'deepseek'
      ? "Start the native service through @deepseek-ai/dsh-mcp-client. After reloading, call mcp__motion__motion_get_project to verify the workspace; DeepSeek model credentials are configured separately in Harness."
      : host === 'chatgpt' ? "The local preview URL cannot connect ChatGPT cloud. Choose a local client to continue."
      : "This configuration belongs to the current workspace. If a motion service already exists, check its data directory. Reopen the client session if needed to load the tools.");
    element('api-section').hidden = host !== 'mcp';
    language.text(element('api-command'), info ? apiDiscoveryCommand(info) : "Reconnect to the workspace to run this query.");
    element<HTMLButtonElement>('copy-api').disabled = !info;
    galleryController?.updateConnection();
  }
  function chooseHost(value: string) { resetCopied(); host = integrationHost(value); renderHost(); }
  root.querySelectorAll<HTMLButtonElement>('[data-host]').forEach(button => button.onclick = () => chooseHost(button.dataset.host!));
  root.querySelectorAll<HTMLButtonElement>('[data-other-host]').forEach(button => button.onclick = () => chooseHost(button.dataset.otherHost!));
  element('host-tabs').onkeydown = event => {
    const buttons = [...element('host-tabs').querySelectorAll<HTMLButtonElement>('button')];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus(); chooseHost(buttons[next].dataset.host!);
  };
  element<HTMLButtonElement>('copy-setup').onclick = event => { if (info && !blocked()) void copy(setupPrompt(info, host), "Connection instruction", event.currentTarget as HTMLButtonElement); };
  element<HTMLButtonElement>('copy-config').onclick = event => { if (info && !blocked()) void copy(manualConnection(info, host), "Configuration", event.currentTarget as HTMLButtonElement); };
  element<HTMLButtonElement>('copy-api').onclick = event => { if (info) void copy(apiDiscoveryCommand(info), "API command", event.currentTarget as HTMLButtonElement); };
  element('show-api').onclick = () => { chooseHost('mcp'); scrollTo('manual-settings'); };
  root.querySelectorAll<HTMLButtonElement>('[data-open-guide]').forEach(button => button.onclick = () => {
    language.text(element('guide-title'), '{host} · Connection guide', { host: hostNames[host] });
    language.text(element('guide-content'), info ? agentGuide(info, host) : "Workspace configuration unavailable. Close this guide and check the connection settings.");
    element<HTMLButtonElement>('copy-guide').disabled = !info;
    element<HTMLDialogElement>('guide-dialog').showModal();
  });
  element<HTMLButtonElement>('copy-guide').onclick = event => { if (info) void copy(agentGuide(info, host), "Connection guide", event.currentTarget as HTMLButtonElement); };

  const toolDescriptions: Record<string, string> = {
    motion_create_project: 'Create an editable project from a template or from scratch.',
    motion_list_templates: 'Get the template catalogue and local index.',
    motion_get_template: 'Read the details and files for one template.',
    motion_open_preview: 'Open the editor and preview the project.',
    motion_import_assets: 'Import media into the project.',
    motion_get_project: 'Read project context, files, assets and revision.',
    motion_edit_project: 'Edit project files and assets with revision checks.',
    motion_export_request: 'Export the project as a video in the background.',
    motion_list_versions: 'List saved project versions.',
    motion_restore_version: 'Restore a saved version while keeping later history.',
    motion_export_cancel: 'Cancel a running or queued export.',
  };
  async function checkConnection() {
    if (checking) return; checking = true;
    element<HTMLButtonElement>('check-connection').disabled = true;
    language.text(element('service-status'), "Checking workspace"); element('service-dot').dataset.ready = 'false';
    try {
      const response = await fetch('/motion-api/integration', { signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(8000)]) });
      if (!response.ok) throw new Error("Workspace unavailable. Check that the OpenDesign service is running.");
      const value = await response.json() as IntegrationInfo;
      if (lifetime.signal.aborted) return;
      if (!['OpenDesign', 'OpenMotion', 'OpenDesign Motion'].includes(value.name) || value.transport?.type !== 'stdio' || !value.transport.command || !Array.isArray(value.transport.args) || !value.transport.env?.MOTION_DATA_DIR || !Array.isArray(value.tools)) throw new Error("Invalid connection configuration. Update or restart the OpenDesign service.");
      info = value; language.text(element('service-status'), 'Workspace reachable · v{version}', { version: info.version });
      element('service-dot').dataset.ready = 'true'; element('workspace-url').textContent = info.previewUrl;
      element('workspace-directory').textContent = info.dataDirectory; element('connection-error').hidden = true;
      element('tool-list').replaceChildren(...info.tools.map(tool => {
        const item = document.createElement('article'), name = document.createElement('code'), description = document.createElement('p');
        item.className = 'connect-tool'; name.textContent = tool.name; language.text(description, toolDescriptions[tool.name] || tool.description);
        item.append(name, description); return item;
      }));
    } catch (error) {
      if (lifetime.signal.aborted) return;
      info = null; language.text(element('service-status'), "Workspace unavailable");
      element('workspace-url').textContent = '—'; element('workspace-directory').textContent = '—';
      language.text(element('connection-error'), error instanceof Error && error.name !== 'TimeoutError' ? error.message : "Connection timed out. Check the local service and try again.");
      element('connection-error').hidden = false; const message = document.createElement('p'); language.text(message, 'Reconnect to view the available tools.'); element('tool-list').replaceChildren(message);
    } finally { checking = false; if (!lifetime.signal.aborted) { element<HTMLButtonElement>('check-connection').disabled = false; renderHost(); } }
  }
  element('check-connection').onclick = () => void checkConnection();

  galleryController = mountTemplates(root, { language, info: () => info, host: () => host, copy, useTemplate: options.useTemplate });
  renderHost();
  return {
    setLanguage(locale: Locale, translate: Translate) { resetCopied(); language.setLanguage(locale, translate); galleryController?.setLanguage(); renderHost(); },
    showTemplates() { galleryController!.showAll(); scrollTo('templates'); },
    resume() { void checkConnection(); galleryController!.resume(); },
    suspend() { galleryController!.suspend(); resetCopied(); root.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close()); },
    destroy() { lifetime.abort(); galleryController!.destroy(); resetCopied(); root.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close()); },
  };
}
