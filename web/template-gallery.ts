import { isEditableTemplate, collectionNames, formatTemplateViews, socialPlatform, templateCategoryLabel } from '../shared/catalog';
import type { GalleryTemplate, TemplatePage } from '../shared/catalog';
import { hostNames, templatePrompt } from '../shared/integration';
import type { IntegrationHost, IntegrationInfo } from '../shared/integration';
import { TemplatePlayback } from './template-playback';
import type { FragmentI18n } from './i18n';

export function mountTemplates(root: HTMLElement, options: {
  info: () => IntegrationInfo | null; host: () => IntegrationHost;
  copy: (value: string, label: string, button?: HTMLButtonElement) => Promise<void>;
  useTemplate: (id: string) => void;
  language: FragmentI18n;
}) {
  const { language } = options, { t } = language;
  const element = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>('#' + id)!;
  const dialog = element<HTMLDialogElement>('template-preview-dialog');
  const search = document.getElementById('template-search') as HTMLInputElement;
  const playback = new TemplatePlayback(), cleanups: (() => void)[] = [];
  const lifetime = new AbortController();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let catalogVersion: string | undefined;
  let catalogWarning: string | undefined;
  let active = false, enabled = false, category = 'featured', loaded = false, next: number | null = 0;
  let request: AbortController | undefined, sequence = 0, shown = 0, preview: GalleryTemplate | undefined;
  let previewCleanup = () => {}, rotation: ReturnType<typeof setInterval> | undefined, debounce: ReturnType<typeof setTimeout> | undefined;
  const canCopy = () => !!options.info() && options.host() !== 'chatgpt';
  const glyph = (name: string) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.setAttribute('class', 'ui-icon'); svg.setAttribute('aria-hidden', 'true'); use.setAttribute('href', '/web/design-system/icons.svg#icon-' + name); svg.append(use); return svg;
  };
  const copyTemplate = (template: GalleryTemplate, button: HTMLButtonElement) => {
    const info = options.info(); if (info && canCopy()) void options.copy(templatePrompt(info, template, language.locale === 'zh-CN' ? 'zh-CN' : 'en'), 'Template instruction', button);
  };
  function configurePlayback() {
    playback.configure(active && enabled && !dialog.open && !document.hidden, window.innerWidth < 680 ? 1 : 2);
  }
  function createMedia(template: GalleryTemplate) {
    const media = document.createElement('div'); media.className = 'connect-template-media home-template-art';
    const badge = document.createElement('span'); badge.className = 'home-template-duration';
    const duration = document.createElement('span'); language.text(duration, template.duration === undefined ? collectionNames[template.collection] : '{value}s', { value: Number(template.duration?.toFixed(1) ?? 0) }); badge.append(glyph('play'), duration);
    media.append(badge);
    const content = document.createElement('div'); content.className = 'home-template-no-preview';
    const label = document.createElement('span'), title = document.createElement('strong'), description = document.createElement('p'), status = document.createElement('small');
    language.text(label, collectionNames[template.collection]); title.textContent = template.title; description.textContent = template.description || template.subtitle;
    language.text(status, "View template content"); content.append(label, title, description, status); media.append(content);
    let cleanup = () => {};
    {
      const poster = document.createElement('img'), video = document.createElement('video');
      // IntersectionObserver assigns src lazily; a hidden native-lazy image would never load.
      poster.alt = ''; poster.loading = 'eager'; poster.decoding = 'async';
      video.muted = true; video.playsInline = true; video.loop = true; video.preload = 'metadata'; video.setAttribute('aria-hidden', 'true');
      let posterReady = false, frameReady = false, failed = false, playing = false, started = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const update = () => {
        poster.hidden = !posterReady; video.hidden = !frameReady || (posterReady && !playing);
        content.hidden = posterReady || frameReady; media.dataset.previewState = playing ? 'playing' : frameReady ? 'frame' : posterReady ? 'poster' : failed ? 'unavailable' : 'content';
        language.text(status, failed ? "Preview unavailable · You can still copy the recreation instruction" : !template.previewUrl && !template.posterUrl ? "View template content and source" : "Loading preview…");
      };
      const unregister = playback.register(template.id, {
        play: () => { if (!video.paused || failed) return; void video.play().catch(() => playback.update(template.id, { ready: false })); },
        pause: () => video.pause(),
      });
      poster.onload = () => { posterReady = true; update(); };
      poster.onerror = () => { posterReady = false; if (!template.previewUrl || failed) failed = true; update(); };
      video.onloadedmetadata = () => { if (Number.isFinite(video.duration) && video.duration > .2) video.currentTime = Math.min(.6, video.duration / 4); };
      video.onloadeddata = () => { clearTimeout(timer); frameReady = true; failed = false; update(); playback.update(template.id, { ready: true }); };
      video.onplaying = () => { playing = true; update(); };
      video.onpause = () => { playing = false; update(); };
      video.onerror = () => { clearTimeout(timer); failed = true; playing = false; frameReady = false; playback.update(template.id, { ready: false }); update(); };
      const start = () => {
        if (started) return; started = true;
        if (template.posterUrl) poster.src = template.posterUrl;
        if (template.previewUrl) {
          video.src = template.previewUrl;
        }
        if (template.previewUrl || template.posterUrl) timer = setTimeout(() => {
          if (!frameReady && !posterReady) { failed = true; update(); }
          if (!frameReady && template.previewUrl) { playback.update(template.id, { ready: false }); video.removeAttribute('src'); video.load(); }
        }, 15000);
        update();
      };
      media.prepend(poster, video); update();
      const loading = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { start(); loading.disconnect(); } }, { root, rootMargin: '160px' }); loading.observe(media);
      const visible = new IntersectionObserver(([entry]) => playback.update(template.id, { visible: entry.isIntersecting }), { root, threshold: .15 }); visible.observe(media);
      media.onmouseenter = () => playback.update(template.id, { priority: true }); media.onmouseleave = () => playback.update(template.id, { priority: false });
      media.addEventListener('focusin', () => playback.update(template.id, { priority: true }));
      media.addEventListener('focusout', () => playback.update(template.id, { priority: false }));
      cleanup = () => { clearTimeout(timer); unregister(); loading.disconnect(); visible.disconnect(); video.pause(); video.removeAttribute('src'); video.load(); poster.removeAttribute('src'); };
    }
    cleanups.push(cleanup);
    const cover = document.createElement('button'); cover.className = 'connect-template-cover'; language.attribute(cover, 'aria-label', 'Preview template {title}', { title: template.title }); cover.onclick = () => showPreview(template);
    const hint = document.createElement('span'); hint.className = 'connect-preview-hint'; hint.setAttribute('aria-hidden', 'true'); const hintLabel = document.createElement('span'); language.text(hintLabel, 'Preview template'); hint.append(glyph('eye'), hintLabel); media.append(cover, hint);
    return media;
  }
  function sourceLink(template: GalleryTemplate) {
    const link = document.createElement('a'); link.className = 'connect-template-source';
    link.href = template.sourceUrl || '#'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    let platform = "Source";
    if (template.sourceUrl) {
      const hostname = new URL(template.sourceUrl).hostname;
      platform = socialPlatform(template.sourceUrl) || (hostname.includes('github') ? 'GitHub' : "Original video");
    }
    const author = document.createElement('span'); author.className = 'connect-template-author'; author.textContent = template.authorName || template.author || 'Hyperframes';
    const source = document.createElement('span'); language.text(source, ' · {platform}', () => ({ platform: t(platform) })); link.append(author, source, glyph('arrow-up-right')); link.title = template.author;
    language.attribute(link, 'aria-label', 'View the original source by {author}', { author: template.author || template.title }); return link;
  }
  function sourceSummary(template: GalleryTemplate) {
    const row = document.createElement('div'); row.className = 'connect-template-source-row'; row.append(sourceLink(template));
    if (template.social) {
      const social = template.social, count = document.createElement('a'), unit = social.platform === 'X' ? "views" : "plays";
      count.className = 'connect-template-views'; count.href = social.sourceUrl; count.target = '_blank'; count.rel = 'noopener noreferrer';
      language.text(count, '{value} {unit}', () => ({ value: formatTemplateViews(social.views, language.locale), unit: t(unit) }));
      const metadata = () => ({ platform: social.platform, value: social.views.toLocaleString(language.locale), unit: t(unit), date: new Intl.DateTimeFormat(language.locale, { timeZone: 'UTC' }).format(new Date(social.syncedAt)) });
      language.attribute(count, 'title', '{platform} original post · {value} {unit} · Hyperframes data · Synced {date}', metadata);
      language.attribute(count, 'aria-label', '{platform} original post · {value} {unit} · Hyperframes data · Synced {date}', metadata); row.append(count);
    }
    return row;
  }
  function createCard(template: GalleryTemplate) {
    const card = document.createElement('article'); card.className = 'connect-template-card'; card.dataset.templateId = template.id;
    const details = document.createElement('div'); details.className = 'connect-template-info';
    const title = document.createElement('button'); title.className = 'connect-template-title'; title.textContent = template.title; title.title = template.title; title.onclick = () => showPreview(template);
    const heading = document.createElement('div'); heading.className = 'connect-template-heading';
    const type = document.createElement('span'); type.className = 'connect-template-category'; language.text(type, templateCategoryLabel(template)); language.attribute(type, 'title', templateCategoryLabel(template));
    heading.append(title, type);
    const actions = document.createElement('div'); actions.className = 'connect-template-card-footer';
    const button = document.createElement('button'); button.className = 'ui-button ui-button--sm connect-remix-button'; const actionLabel = document.createElement('span'); language.text(actionLabel, 'Copy to recreate'); button.append(glyph('copy'), actionLabel); button.dataset.copyTemplate = template.id;
    button.disabled = !canCopy(); language.attribute(button, 'aria-label', 'Copy to recreate {title}', { title: template.title }); button.onclick = () => copyTemplate(template, button);
    actions.append(sourceSummary(template), button); details.append(heading, actions); card.append(createMedia(template), details); return card;
  }
  function updateWarning(warning?: string) {
    catalogWarning = warning;
    element('catalog-error').hidden = !warning;
    language.text(element('catalog-error-text'), warning || '');
  }
  async function load(reset: boolean) {
    if (!active) return;
    request?.abort(); const controller = new AbortController(); request = controller; const ticket = ++sequence;
    if (reset) { cleanups.splice(0).forEach(clean => clean()); element('template-grid').replaceChildren(); shown = 0; next = 0; loaded = false; }
    element('catalog-error').hidden = true; element('template-panel').setAttribute('aria-busy', 'true');
    element<HTMLButtonElement>('more-templates').disabled = true; language.text(element('template-count'), "Loading templates…");
    const params = new URLSearchParams({ category, query: search.value, offset: String(reset ? 0 : next ?? 0), limit: '6', grouped: 'true', covered: 'true' });
    try {
      const response = await fetch('/motion-api/template-catalog?' + params, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      if (!response.ok) throw new Error("Template catalogue unavailable");
      const page = await response.json() as TemplatePage;
      if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total)) throw new Error("Invalid template catalogue");
      if (ticket !== sequence || !active) return;
      catalogVersion = page.catalogVersion;
      updateWarning(page.warning);
      element('template-grid').append(...page.items.map(createCard)); shown += page.items.length; next = page.next; loaded = true;
      language.text(element('template-count'), page.total ? 'Groups: {shown} / {total} · Templates and clips: {entries}' : 'No matching templates. Try another name, creator or style.', { shown, total: page.total, entries: page.entryTotal });
      element('more-templates').hidden = next === null;
      const shortcut = document.getElementById('connection-templates')!; language.text(shortcut, 'All templates · {total}', { total: page.galleryTotal ?? page.catalogTotal });
    } catch (error) {
      if (controller.signal.aborted || ticket !== sequence) return;
      element('catalog-error').hidden = false; language.text(element('catalog-error-text'), '{error} Please try again.', () => ({ error: t(error instanceof Error ? error.message : 'Template catalogue unavailable') }));
      language.text(element('template-count'), shown ? 'Template groups shown · {shown}' : 'Catalogue unavailable', { shown });
    } finally {
      if (ticket === sequence) { request = undefined; element('template-panel').setAttribute('aria-busy', 'false'); element<HTMLButtonElement>('more-templates').disabled = false; }
    }
  }
  const catalogTimer = setInterval(() => {
    if (!active || request || document.visibilityState === 'hidden' || !catalogVersion) return;
    const ticket = sequence;
    void fetch('/motion-api/template-catalog?limit=1', { signal: lifetime.signal }).then(response => response.ok ? response.json() : null).then(page => {
      if (!active || lifetime.signal.aborted || request || ticket !== sequence || !page?.catalogVersion) return;
      if (page.catalogVersion !== catalogVersion) void load(true);
      else if (page.warning !== catalogWarning) updateWarning(page.warning);
    }).catch(() => {});
  }, 5_000);
  lifetime.signal.addEventListener('abort', () => clearInterval(catalogTimer), { once: true });
  function chooseCategory(button: HTMLButtonElement) {
    clearTimeout(debounce); category = button.dataset.category!;
    root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(item => { const selected = item === button; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
    element('template-panel').setAttribute('aria-labelledby', button.id); void load(true);
  }
  root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button => button.onclick = () => chooseCategory(button));
  element('template-tabs').onkeydown = event => {
    const buttons = [...element('template-tabs').querySelectorAll<HTMLButtonElement>('button')], index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[target].focus(); chooseCategory(buttons[target]);
  };
  search.oninput = () => { clearTimeout(debounce); request?.abort(); debounce = setTimeout(() => { element('templates').scrollIntoView({ block: 'start' }); void load(true); }, 180); };
  element('more-templates').onclick = () => { if (next !== null && !request) void load(false); };
  element('retry-catalog').onclick = () => void load(shown === 0);
  function renderPlayback() {
    const button = element<HTMLButtonElement>('toggle-previews');
    button.setAttribute('aria-pressed', String(enabled)); language.attribute(button, 'aria-label', enabled ? "Pause animated previews" : "Play animated previews"); const label = document.createElement('span'); language.text(label, 'Animated previews'); button.replaceChildren(glyph(enabled ? 'pause' : 'play'), label); configurePlayback();
  }
  function restorePlayback() {
    let saved = true; try { saved = localStorage.getItem('openmotion.template-previews') !== 'paused'; } catch {}
    enabled = !reducedMotion.matches && saved; renderPlayback();
  }
  element('toggle-previews').onclick = () => {
    enabled = !enabled; try { localStorage.setItem('openmotion.template-previews', enabled ? 'playing' : 'paused'); } catch {}
    renderPlayback();
  };
  restorePlayback(); reducedMotion.addEventListener('change', restorePlayback, { signal: lifetime.signal }); window.addEventListener('resize', configurePlayback, { signal: lifetime.signal });
  function updateConnection() {
    root.querySelectorAll<HTMLButtonElement>('[data-copy-template], #copy-preview-template').forEach(button => button.disabled = !canCopy());
    if (preview) {
      const info = options.info(); language.text(element('preview-prompt'), info ? templatePrompt(info, preview, language.locale === 'zh-CN' ? 'zh-CN' : 'en') : "Reconnect to copy the recreation instruction.");
      language.text(element('preview-copy-hint'), options.host() === 'chatgpt' ? 'Choose an available local client to start recreating.' : 'Copy the instruction and send it to {host} to start recreating.', { host: hostNames[options.host()] });
    }
  }
  function showSelection(template: GalleryTemplate) {
    previewCleanup(); preview = template;
    element('preview-title').textContent = template.title; element('preview-description').textContent = template.subtitle;
    language.text(element('preview-detail'), '{details}', () => ({ details: [t(templateCategoryLabel(template)), template.duration === undefined ? '' : t('{value} seconds', { value: Number(template.duration.toFixed(1)) }), template.ratio || ''].filter(Boolean).join(' · ') }));
    element('preview-source').replaceChildren(sourceSummary(template));
    element('preview-error').hidden = true; element('use-preview-template').hidden = !isEditableTemplate(template);
    const stage = element('template-preview-stage'); stage.replaceChildren();
    dialog.classList.toggle('connect-preview-dialog--portrait', template.ratio === '9:16' || template.kind === 'builtin');
    if (template.previewUrl) {
      const video = document.createElement('video'); video.controls = true; video.muted = true; video.playsInline = true; video.autoplay = !reducedMotion.matches; video.loop = true; video.preload = 'metadata'; language.attribute(video, 'aria-label', '{title} reference video', { title: template.title }); if (template.posterUrl) video.poster = template.posterUrl;
      let timer: ReturnType<typeof setTimeout>;
      const failed = () => { clearTimeout(timer); language.text(element('preview-error'), "Preview could not load. View the template content and recreation instruction, or reopen the preview to try again."); element('preview-error').hidden = false; };
      video.onerror = failed; video.onloadeddata = () => clearTimeout(timer); video.src = template.previewUrl; stage.append(video); timer = setTimeout(failed, 15000);
      previewCleanup = () => { clearTimeout(timer); video.onerror = null; video.pause(); video.removeAttribute('src'); video.load(); };
    } else if (template.posterUrl) {
      const poster = document.createElement('img'); language.attribute(poster, 'alt', '{title} template cover', { title: template.title }); poster.src = template.posterUrl; stage.append(poster);
      poster.onerror = () => { stage.replaceChildren(contentPreview(template)); }; previewCleanup = () => { poster.onerror = null; poster.removeAttribute('src'); };
    } else { stage.append(contentPreview(template)); previewCleanup = () => {}; }
    updateConnection();
  }
  function contentPreview(template: GalleryTemplate) {
    const content = document.createElement('div'); content.className = 'home-template-no-preview'; const label = document.createElement('span'), title = document.createElement('strong'), text = document.createElement('p');
    language.text(label, '{collection} · Template content', () => ({ collection: t(collectionNames[template.collection]) })); title.textContent = template.title; text.textContent = template.description || template.subtitle; content.append(label, title, text); return content;
  }
  function showPreview(template: GalleryTemplate) {
    const variants = template.variants || [template], select = element<HTMLSelectElement>('preview-variants');
    element('preview-variants-field').hidden = variants.length < 2; language.text(element('preview-variants-label'), 'Related references · {count}', { count: variants.length });
    select.replaceChildren(...variants.map(item => { const option = document.createElement('option'); option.value = item.id; language.text(option, '{collection} · {title}', () => ({ collection: t(collectionNames[item.collection]), title: item.title })); return option; }));
    select.value = template.id; select.onchange = () => showSelection(variants.find(item => item.id === select.value)!);
    showSelection(template); dialog.showModal(); configurePlayback();
  }
  element('close-template-preview').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { previewCleanup(); previewCleanup = () => {}; preview = undefined; configurePlayback(); }, { signal: lifetime.signal });
  element('copy-preview-template').onclick = event => { if (preview) copyTemplate(preview, event.currentTarget as HTMLButtonElement); };
  element('use-preview-template').onclick = () => { if (preview && isEditableTemplate(preview)) { const id = preview.id; dialog.close(); options.useTemplate(id); } };
  document.addEventListener('visibilitychange', () => { configurePlayback(); if (document.hidden) element('template-preview-stage').querySelector('video')?.pause(); }, { signal: lifetime.signal });
  function suspend() { active = false; if (request) { request.abort(); loaded = false; } clearTimeout(debounce); clearInterval(rotation); configurePlayback(); if (dialog.open) dialog.close(); previewCleanup(); }
  return {
    updateConnection,
    showAll() { search.value = ''; chooseCategory(element<HTMLButtonElement>('template-tab-featured')); },
    resume() { active = true; if (!loaded) void load(true); clearInterval(rotation); rotation = setInterval(() => { if (active && enabled && !dialog.open && !document.hidden) playback.advance(); }, 4200); configurePlayback(); },
    suspend,
    destroy() { suspend(); lifetime.abort(); cleanups.splice(0).forEach(clean => clean()); element('template-grid').replaceChildren(); },
  };
}
