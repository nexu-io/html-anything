import { App } from '@modelcontextprotocol/ext-apps/app-with-deps';
import { templateIds } from './types.ts';
import { isLanguage, resolveLanguage, translations } from './i18n.ts';
import type { CreateArgs, HostContext, Recommendation, RecommendationCard, TemplateAsset, TemplateCardsBootstrap, TemplateCardsHost, Language, TemplateId } from './types.ts';

declare global { interface Window { __OPENMOTION_TEMPLATE_CARDS__?: TemplateCardsBootstrap } }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type CopyKey = keyof typeof translations.en.ui;
type Intent = 'auto' | 'play' | 'pause';
type CardState = {
  card: RecommendationCard; asset: TemplateAsset; article: HTMLElement; video: HTMLVideoElement;
  cover: HTMLButtonElement; title: HTMLButtonElement; clone: HTMLButtonElement;
  status: HTMLElement; feedback: HTMLElement; visible: boolean; ready: boolean; presented: boolean; intent: Intent; url: string;
};
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
function sameKeys(value: Record<string, unknown>, keys: string[]) { return Object.keys(value).sort().join('|') === keys.sort().join('|'); }

export function recreationPrompt(card: Pick<RecommendationCard, 'title' | 'templateId'>, language: Language = 'zh'): string {
  const text = translations[language].prompt, colon = language === 'zh' ? '：' : ': ';
  return `${text.brief}${colon}${text.instruction}\n\n${text.template}${colon}${card.title}\n${text.id}${colon}${card.templateId}\n\n${text.requirements}${colon.trimEnd()}\n`;
}

/** Validate and copy the host result before it can become an actionable choice. */
export function readRecommendation(value: unknown, bootstrap: TemplateCardsBootstrap): Recommendation | null {
  if (!record(value) || value.schemaVersion !== 1 || value.resourceVersion !== bootstrap.resourceVersion
    || typeof value.recommendationId !== 'string' || !uuid.test(value.recommendationId)
    || typeof value.selectionGuide !== 'string' || !Array.isArray(value.cards) || value.cards.length !== 3
    || (value.language !== undefined && !isLanguage(value.language))
    || (value.onboarding !== undefined && typeof value.onboarding !== 'boolean')) return null;
  const assets = new Map(bootstrap.templates.map(asset => [asset.id, asset]));
  const used = new Set<string>(), requests = new Set<string>();
  const cards: RecommendationCard[] = [];
  for (const [index, input] of value.cards.entries()) {
    if (!record(input) || typeof input.templateId !== 'string') return null;
    const asset = assets.get(input.templateId), args = input.createArgs;
    if (!asset || !templateIds.includes(input.templateId as typeof templateIds[number]) || used.has(asset.id)
      || input.position !== index + 1 || input.title !== asset.title || input.description !== asset.description
      || input.durationSeconds !== asset.durationSeconds || typeof input.actionRequestId !== 'string'
      || !uuid.test(input.actionRequestId) || requests.has(input.actionRequestId) || !record(args)
      || !sameKeys(args, ['requestId', 'projectType', 'templateId', 'title', 'requirements'])
      || args.requestId !== input.actionRequestId || args.projectType !== 'template'
      || args.templateId !== asset.id || args.title !== asset.title || typeof args.requirements !== 'string'
      || !args.requirements.trim() || args.requirements.length > 8000) return null;
    used.add(asset.id); requests.add(input.actionRequestId);
    const createArgs: CreateArgs = Object.freeze({ requestId: input.actionRequestId, projectType: 'template',
      templateId: asset.id, title: asset.title, requirements: args.requirements });
    cards.push(Object.freeze({ position: index + 1, templateId: asset.id, title: asset.title, description: asset.description,
      durationSeconds: asset.durationSeconds, actionRequestId: input.actionRequestId, createArgs }));
  }
  return Object.freeze({ schemaVersion: 1, resourceVersion: bootstrap.resourceVersion,
    recommendationId: value.recommendationId, ...(isLanguage(value.language) ? { language: value.language } : {}), cards: Object.freeze(cards), selectionGuide: value.selectionGuide,
    ...(value.onboarding === true ? { onboarding: true } : {}) });
}

export function mountTemplateCards(root: HTMLElement, bootstrap: TemplateCardsBootstrap, host: TemplateCardsHost) {
  const doc = root.ownerDocument, win = doc.defaultView!;
  let context = host.getHostContext?.() ?? {}, connected = false, destroyed = false, generation = 0, busy = false;
  let snapshot: Recommendation | null = null, states: CardState[] = [], observer: IntersectionObserver | undefined;
  let detail: { section: HTMLElement; video: HTMLVideoElement; title: HTMLElement; back: HTMLButtonElement;
    clone: HTMLButtonElement; status: HTMLElement; feedback: HTMLElement; visible: boolean;
    selected?: CardState; trigger?: HTMLElement; intent: Intent } | undefined;
  const mediaQuery = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = mediaQuery?.matches ?? false;
  const cleanups: (() => void)[] = [], lifetime: (() => void)[] = [];
  const pendingPause = new WeakMap<HTMLVideoElement, number>(), pendingPlay = new WeakMap<HTMLVideoElement, number>();
  const playingRequest = new WeakMap<HTMLVideoElement, { cancelled: boolean }>();
  const language = () => snapshot?.language ?? resolveLanguage(context.locale);
  const t = (key: CopyKey) => translations[language()].ui[key];
  function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
    const node = doc.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function listen(target: EventTarget, event: string, handler: EventListener, permanent = false) {
    target.addEventListener(event, handler); (permanent ? lifetime : cleanups).push(() => target.removeEventListener(event, handler));
  }
  function intentPlays(intent: Intent) { return intent === 'play' || (intent === 'auto' && !reduced); }
  function isDocumentVisible() { return doc.visibilityState !== 'hidden'; }
  function consume(events: WeakMap<HTMLVideoElement, number>, video: HTMLVideoElement) {
    const count = events.get(video) ?? 0;
    if (!count) return false;
    if (count === 1) events.delete(video); else events.set(video, count - 1);
    return true;
  }
  function expectedPause(video: HTMLVideoElement) {
    const attempt = playingRequest.get(video); if (attempt) attempt.cancelled = true;
    if (video.paused) return;
    pendingPause.set(video, (pendingPause.get(video) ?? 0) + 1); video.pause();
  }
  function play(video: HTMLVideoElement, status: HTMLElement, currentGeneration: number) {
    if (!video.paused || playingRequest.has(video)) return;
    const attempt = { cancelled: false };
    playingRequest.set(video, attempt); pendingPlay.set(video, (pendingPlay.get(video) ?? 0) + 1);
    try {
      Promise.resolve(video.play()).catch(error => {
        consume(pendingPlay, video);
        if (destroyed || generation !== currentGeneration || attempt.cancelled) return;
        feedback(status, error?.name === 'NotAllowedError' ? 'blocked' : 'failed');
      }).finally(() => {
        if (playingRequest.get(video) === attempt) playingRequest.delete(video);
        if (attempt.cancelled && !destroyed && generation === currentGeneration) reconcile();
      });
    } catch { playingRequest.delete(video); consume(pendingPlay, video); feedback(status, 'failed'); }
  }
  function reconcile() {
    if (destroyed) return;
    for (const state of states) {
      state.article.dataset.mediaReady = String(state.ready && (state.intent === 'play'
        || (state.intent === 'auto' && !reduced) || (state.intent === 'pause' && state.presented)));
      const eligible = isDocumentVisible() && state.visible && !detail?.selected && intentPlays(state.intent);
      if (eligible) play(state.video, state.status, generation); else expectedPause(state.video);
    }
    if (detail) {
      if (detail.selected && isDocumentVisible() && detail.visible && intentPlays(detail.intent)) play(detail.video, detail.status, generation);
      else expectedPause(detail.video);
    }
  }
  function label(target: HTMLElement, key: CopyKey) { target.dataset.copyKey = key; target.textContent = t(key); }
  function feedback(target: HTMLElement, key: CopyKey) { target.hidden = false; label(target, key); }
  function canPrepareDraft() {
    const capabilities = host.getHostCapabilities();
    return connected && Boolean(capabilities?.message) && record(capabilities?.experimental?.['openai/message']);
  }
  function showManualDraft(prompt: string, card: RecommendationCard) {
    let draft = root.querySelector<HTMLTextAreaElement>('.omtc-draft');
    if (!draft) {
      draft = element('textarea', 'omtc-draft'); draft.readOnly = true; draft.rows = 6;
      draft.setAttribute('aria-label', t('draftLabel')); root.append(draft);
    }
    draft.dataset.templateId = card.templateId; draft.value = prompt; draft.focus(); draft.select();
  }
  function refreshLabels() {
    root.lang = language();
    refreshWelcome();
    root.querySelector('.omtc-list')?.setAttribute('aria-label', t('listLabel'));
    for (const node of root.querySelectorAll<HTMLElement>('[data-copy-key]')) label(node, node.dataset.copyKey as CopyKey);
    const draft = root.querySelector<HTMLTextAreaElement>('.omtc-draft');
    const draftCard = states.find(state => state.card.templateId === draft?.dataset.templateId)?.card;
    if (draft && draftCard) { draft.value = recreationPrompt(draftCard, language()); draft.setAttribute('aria-label', t('draftLabel')); }
    for (const state of states) {
      state.article.querySelector('.omtc-description')!.textContent = translations[language()].descriptions[state.card.templateId as TemplateId];
      state.cover.setAttribute('aria-label', `${t('preview')} ${state.card.title}`);
      state.cover.querySelector('[data-preview-label]')!.textContent = t('preview');
      state.clone.textContent = t('clone'); state.clone.setAttribute('aria-label', `${t('clone')} ${state.card.title}`);
      state.clone.disabled = busy || !connected;
    }
    if (detail) {
      detail.back.textContent = t('back'); detail.clone.textContent = t('clone'); detail.clone.disabled = busy || !connected;
      detail.video.setAttribute('aria-label', t('player'));
    }
    const hint = root.querySelector('[data-selection-hint]'); if (hint) hint.textContent = t('numeric');
    if (context.theme === 'dark' || context.theme === 'light') doc.documentElement.style.colorScheme = context.theme;
  }
  function refreshWelcome() {
    let welcome = root.querySelector<HTMLElement>('.omtc-welcome');
    if (!snapshot?.onboarding) { welcome?.remove(); return; }
    if (!welcome) { welcome = element('section', 'omtc-welcome'); welcome.setAttribute('aria-label', t('welcomeLabel')); root.prepend(welcome); }
    welcome.setAttribute('aria-label', t('welcomeLabel'));
    const text = translations[language()].welcome;
    const recommendation = element('p'); recommendation.append(element('strong', '', text.recommendations));
    welcome.replaceChildren(element('h2', '', text.heading), element('p', '', text.introduction),
      element('p', '', text.discovery), recommendation, element('p', '', text.draft));
    welcome.hidden = Boolean(detail?.selected);
  }
  function cleanupView() {
    generation++; busy = false; observer?.disconnect(); observer = undefined;
    for (const cleanup of cleanups.splice(0)) cleanup();
    if (detail) { detail.video.pause(); detail.video.removeAttribute('src'); detail.video.load(); }
    for (const state of states) {
      state.video.pause(); state.video.removeAttribute('src'); state.video.load(); win.URL.revokeObjectURL(state.url);
    }
    states = []; detail = undefined; root.replaceChildren();
  }
  function closeDetail() {
    if (!detail?.selected) return;
    const current = detail, selected = current.selected!;
    selected.intent = current.intent;
    if (current.video.readyState >= 1 && Number.isFinite(current.video.currentTime)) selected.video.currentTime = current.video.ended ? 0 : current.video.currentTime;
    current.selected = undefined; expectedPause(current.video); current.section.hidden = true;
    root.querySelector<HTMLElement>('.omtc-list')!.hidden = false;
    const welcome = root.querySelector<HTMLElement>('.omtc-welcome'); if (welcome) welcome.hidden = false;
    reconcile();
    if (current.trigger?.isConnected) current.trigger.focus();
  }
  function openDetail(state: CardState, trigger: HTMLElement) {
    if (!detail) return;
    const current = detail, currentGeneration = generation;
    current.selected = state; current.trigger = trigger; current.intent = state.intent; current.visible = true;
    current.title.textContent = state.card.title; current.feedback.hidden = state.feedback.hidden;
    current.feedback.textContent = state.feedback.textContent; current.status.hidden = true;
    current.video.poster = `data:${state.asset.posterMimeType};base64,${state.asset.posterBase64}`;
    current.video.muted = true;
    current.video.src = state.url;
    const time = state.video.currentTime;
    const onMetadata = () => {
      current.video.removeEventListener('loadedmetadata', onMetadata);
      if (destroyed || generation !== currentGeneration || detail !== current || current.selected !== state) return;
      current.video.currentTime = Number.isFinite(current.video.duration) ? Math.min(time, Math.max(0, current.video.duration - 0.001)) : time;
      reconcile();
    };
    current.video.addEventListener('loadedmetadata', onMetadata);
    cleanups.push(() => current.video.removeEventListener('loadedmetadata', onMetadata));
    current.video.load();
    root.querySelector<HTMLElement>('.omtc-list')!.hidden = true; current.section.hidden = false;
    const welcome = root.querySelector<HTMLElement>('.omtc-welcome'); if (welcome) welcome.hidden = true;
    reconcile(); current.back.focus();
  }
  async function prepareDraft(card: RecommendationCard, target: HTMLElement) {
    if (destroyed || busy) return;
    const showFeedback = (key: CopyKey) => {
      feedback(target, key);
      const state = states.find(item => item.card === card); if (state) feedback(state.feedback, key);
      if (detail?.selected?.card === card) feedback(detail.feedback, key);
    };
    const prompt = recreationPrompt(card, language());
    if (!canPrepareDraft()) { showFeedback('manual'); showManualDraft(prompt, card); return; }
    const currentGeneration = generation;
    busy = true; refreshLabels(); showFeedback('sending');
    try {
      // Without the negotiated extension, an older host could ignore metadata and submit a task.
      const result = await host.sendMessage({ role: 'user', content: [{ type: 'text', text: prompt }],
        _meta: { 'openai/message': { target: 'active', send: false } } });
      if (destroyed || generation !== currentGeneration) return;
      if (result?.isError || result?.cancelled || result?.status === 'cancelled') { showFeedback('notSent'); showManualDraft(prompt, card); }
      else {
        for (const node of [target, ...states.map(state => state.feedback), ...(detail ? [detail.feedback] : [])]) {
          node.hidden = true; node.textContent = ''; delete node.dataset.copyKey;
        }
        root.querySelector('.omtc-draft')?.remove();
      }
    } catch { if (!destroyed && generation === currentGeneration) { showFeedback('notSent'); showManualDraft(prompt, card); } }
    finally { if (!destroyed && generation === currentGeneration) { busy = false; refreshLabels(); } }
  }
  function wireVideo(video: HTMLVideoElement, status: HTMLElement, owner: CardState | null, currentGeneration: number) {
    const valid = () => !destroyed && generation === currentGeneration;
    listen(video, 'loadeddata', () => {
      if (!valid()) return; status.hidden = true;
      if (owner) { owner.ready = true; reconcile(); }
    });
    listen(video, 'error', () => { if (valid()) { if (owner) owner.article.dataset.mediaReady = 'false'; feedback(status, 'failed'); } });
    listen(video, 'play', () => {
      if (!valid()) return;
      if (owner) owner.presented = true;
      if (!consume(pendingPlay, video)) {
        if (owner) owner.intent = 'play'; else if (detail?.selected) detail.intent = 'play';
      }
      status.hidden = true; reconcile();
    });
    listen(video, 'pause', () => {
      if (!valid()) return;
      if (consume(pendingPause, video)) return;
      if (!owner && video.ended) return;
      if (owner) owner.intent = 'pause'; else if (detail?.selected) detail.intent = 'pause';
    });
  }
  function render(next: Recommendation) {
    cleanupView(); snapshot = next; root.classList.add('omtc');
    const currentGeneration = generation, list = element('section', 'omtc-list');
    list.setAttribute('aria-label', t('listLabel')); root.append(list);
    const detailSection = element('section', 'omtc-detail'); detailSection.hidden = true;
    const back = element('button', 'omtc-back'); back.type = 'button';
    const title = element('h2', 'omtc-detail-title'), player = element('video', 'omtc-player');
    player.controls = true; player.playsInline = true; player.muted = true; player.preload = 'metadata';
    const mediaStatus = element('p', 'omtc-status'), clone = element('button', 'omtc-clone'), detailFeedback = element('p', 'omtc-feedback');
    clone.type = 'button'; mediaStatus.hidden = true; detailFeedback.hidden = true; detailFeedback.setAttribute('role', 'status');
    detailSection.append(back, title, player, mediaStatus, clone, detailFeedback); root.append(detailSection);
    detail = { section: detailSection, video: player, title, back, clone, status: mediaStatus,
      feedback: detailFeedback, visible: false, intent: 'auto' };
    wireVideo(player, mediaStatus, null, currentGeneration);
    listen(back, 'click', () => closeDetail());
    listen(clone, 'click', () => { if (detail?.selected && snapshot) void prepareDraft(detail.selected.card, detail.feedback); });
    if (typeof win.IntersectionObserver === 'function') {
      observer = new win.IntersectionObserver(entries => {
        if (destroyed || generation !== currentGeneration) return;
        for (const entry of entries) {
          const visible = entry.isIntersecting && entry.intersectionRatio > 0;
          const state = states.find(item => item.article === entry.target);
          if (state) state.visible = visible; else if (detail?.section === entry.target) detail.visible = visible;
        }
        reconcile();
      }, { threshold: 0.01 });
    }
    for (const card of next.cards) {
      const asset = bootstrap.templates.find(item => item.id === card.templateId)!;
      const binary = win.atob(asset.videoBase64), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = win.URL.createObjectURL(new win.Blob([bytes.buffer], { type: 'video/mp4' }));
      const article = element('article', 'omtc-card'); article.dataset.templateId = card.templateId;
      const cover = element('button', 'omtc-cover'); cover.type = 'button';
      const poster = element('img'); poster.src = `data:${asset.posterMimeType};base64,${asset.posterBase64}`; poster.alt = '';
      const video = element('video'); video.defaultMuted = true; video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-hidden', 'true');
      const previewLabel = element('span', 'omtc-preview-label'); previewLabel.dataset.previewLabel = '';
      cover.append(poster, video, previewLabel);
      const info = element('div', 'omtc-info'), heading = element('div', 'omtc-heading');
      const position = element('span', 'omtc-position', String(card.position)), titleButton = element('button', 'omtc-title', card.title);
      titleButton.type = 'button'; titleButton.title = card.title; titleButton.dataset.templateTitle = '';
      heading.append(position, titleButton);
      const description = element('p', 'omtc-description', card.description), status = element('p', 'omtc-status', t('loading'));
      const cloneButton = element('button', 'omtc-clone'), cardFeedback = element('p', 'omtc-feedback');
      label(status, 'loading'); cloneButton.type = 'button'; cardFeedback.hidden = true; cardFeedback.setAttribute('role', 'status');
      info.append(heading, description, status, cloneButton, cardFeedback); article.append(cover, info); list.append(article);
      const state: CardState = { card, asset, article, video, cover, title: titleButton, clone: cloneButton, status,
        feedback: cardFeedback, visible: false, ready: false, presented: false, intent: 'auto', url };
      states.push(state); wireVideo(video, status, state, currentGeneration);
      listen(cover, 'click', () => openDetail(state, cover)); listen(titleButton, 'click', () => openDetail(state, titleButton));
      listen(cloneButton, 'click', () => void prepareDraft(card, cardFeedback));
      observer?.observe(article); video.src = url; video.load();
    }
    observer?.observe(detailSection);
    if (!next.onboarding) { const hint = element('p', 'omtc-hint'); hint.dataset.selectionHint = ''; root.append(hint); }
    refreshLabels(); reconcile();
  }
  listen(doc, 'visibilitychange', () => reconcile(), true);
  const onReduced = () => { reduced = mediaQuery?.matches ?? false; reconcile(); };
  mediaQuery?.addEventListener?.('change', onReduced); lifetime.push(() => mediaQuery?.removeEventListener?.('change', onReduced));
  listen(root, 'keydown', event => {
    const key = event as KeyboardEvent;
    if (key.key === 'Escape' && detail?.selected && !doc.fullscreenElement) { key.preventDefault(); key.stopPropagation(); closeDetail(); }
  }, true);
  root.classList.add('omtc'); root.replaceChildren(element('p', 'omtc-status', t('waiting')));
  return {
    update(value: unknown) {
      if (destroyed) return;
      const next = readRecommendation(value, bootstrap);
      if (!next) { cleanupView(); snapshot = null; const error = element('p', 'omtc-status', t('unavailable')); error.setAttribute('role', 'alert'); root.append(error); return; }
      if (snapshot && JSON.stringify(snapshot) === JSON.stringify(next)) return;
      try { render(next); } catch { cleanupView(); snapshot = null; const error = element('p', 'omtc-status', t('unavailable')); error.setAttribute('role', 'alert'); root.append(error); }
    },
    setConnected(value: boolean) {
      connected = value;
      if (!value && !snapshot) { const error = element('p', 'omtc-status', t('unavailable')); error.setAttribute('role', 'alert'); root.replaceChildren(error); }
      refreshLabels();
    },
    setHostContext(value: HostContext) { context = { ...context, ...value }; refreshLabels(); },
    destroy() { if (destroyed) return; cleanupView(); destroyed = true; snapshot = null; for (const cleanup of lifetime.splice(0)) cleanup(); },
  };
}

/** The production entry is inert when imported by the DOM test harness. */
if (typeof window !== 'undefined' && window.__OPENMOTION_TEMPLATE_CARDS__) {
  const root = document.getElementById('openmotion-template-cards');
  if (root) {
    const app = new App({ name: 'OpenMotion template recommendations', version: '1.0.0' }, {});
    const ui = mountTemplateCards(root, window.__OPENMOTION_TEMPLATE_CARDS__, app);
    app.ontoolresult = result => ui.update(result.structuredContent);
    app.onhostcontextchanged = () => ui.setHostContext(app.getHostContext() ?? {});
    app.onteardown = async () => { ui.destroy(); return {}; };
    window.addEventListener('pagehide', () => ui.destroy(), { once: true });
    app.connect().then(() => { ui.setHostContext(app.getHostContext() ?? {}); ui.setConnected(true); }).catch(() => ui.setConnected(false));
  }
}
