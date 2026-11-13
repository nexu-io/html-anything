import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { App } from '@modelcontextprotocol/ext-apps/app-with-deps';
import { mountTemplateCards, recreationPrompt } from '../mcp-ui/template-recommendations/app.ts';
import { translations, languages, resolveLanguage } from '../mcp-ui/template-recommendations/i18n.ts';
import type { TemplateCardsHost } from '../mcp-ui/template-recommendations/types.ts';

const ids = ['product-promo', 'nyt-graph', 'decision-tree'];
const titles = ['Product Promo', 'NYT Graph', 'Decision Tree'];
const bootstrap = { resourceVersion: 'resource-v1', templates: ids.map((id, i) => ({ id, title: titles[i],
  description: 'Template ' + (i + 1), durationSeconds: [20, 15, 10][i], videoBase64: 'AAAA', posterBase64: 'AAAA', posterMimeType: 'image/jpeg' as const })) };
function result(order = [2, 0, 1], recommendationId = '11111111-1111-4111-8111-111111111111') {
  return { schemaVersion: 1, resourceVersion: bootstrap.resourceVersion, recommendationId,
    cards: order.map((i, position) => { const actionRequestId = `22222222-2222-4222-8222-${String(i + 1).padStart(12, '0')}`;
      return { position: position + 1, templateId: ids[i], title: titles[i], description: bootstrap.templates[i].description,
        durationSeconds: bootstrap.templates[i].durationSeconds, actionRequestId,
        createArgs: { requestId: actionRequestId, projectType: 'template', templateId: ids[i], title: titles[i], requirements: 'Use the unchanged sample; no export.' } }; }),
    selectionGuide: 'Use the selected exact template.' };
}

test('the real component waits for a result and renders the frozen ordered selection', () => {
  const window = new Window();
  const root = window.document.createElement('main'); window.document.body.append(root);
  window.URL.createObjectURL = () => 'blob:test'; window.URL.revokeObjectURL = () => {};
  const host = { sendMessage: async () => ({}), getHostCapabilities: () => ({ message: {} }), getHostContext: () => ({ locale: 'en' }) };
  const ui = mountTemplateCards(root as unknown as HTMLElement, bootstrap, host);
  try {
    assert.equal(root.querySelectorAll('article').length, 0);
    ui.update(result());
    assert.deepEqual([...root.querySelectorAll('article')].map(card => card.getAttribute('data-template-id')), ['decision-tree', 'product-promo', 'nyt-graph']);
    assert.deepEqual([...root.querySelectorAll('[data-template-title]')].map(title => title.textContent), ['Decision Tree', 'Product Promo', 'NYT Graph']);
    assert.equal(root.querySelectorAll('video').length, 4);
  } finally { ui.destroy(); window.happyDOM.abort(); }
});

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
function fixture(options: { reduced?: boolean; message?: boolean; draft?: boolean; send?: TemplateCardsHost['sendMessage'] } = {}) {
  const window = new Window(), doc = window.document;
  let visibility = 'visible', reduced = options.reduced ?? false, allocated = 0;
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => visibility });
  const changes = new Set<() => void>();
  window.matchMedia = (() => ({ get matches() { return reduced; }, addEventListener: (_: string, fn: () => void) => changes.add(fn),
    removeEventListener: (_: string, fn: () => void) => changes.delete(fn) })) as typeof window.matchMedia;
  const observers: { targets: Set<Element>; disconnected: boolean; emit: (visible: boolean) => void }[] = [];
  window.IntersectionObserver = class {
    targets = new Set<Element>(); disconnected = false;
    callback: (entries: unknown[]) => void;
    constructor(callback: (entries: unknown[]) => void) { this.callback = callback; observers.push(this); }
    observe(target: Element) { this.targets.add(target); }
    unobserve(target: Element) { this.targets.delete(target); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    emit(visible: boolean) { if (!this.disconnected) this.callback([...this.targets].map(target => ({ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }))); }
  } as unknown as typeof window.IntersectionObserver;
  const revoked: string[] = [];
  window.URL.createObjectURL = () => 'blob:test-' + ++allocated;
  window.URL.revokeObjectURL = url => { revoked.push(url); };
  const media = new WeakMap<object, { paused: boolean; time: number; duration: number; ready: number; plays: number; ended: boolean }>();
  const nextPlay = new WeakMap<object, () => Promise<void>>();
  function state(video: object) {
    let value = media.get(video);
    if (!value) { value = { paused: true, time: 0, duration: NaN, ready: 0, plays: 0, ended: false }; media.set(video, value); }
    return value;
  }
  const proto = window.HTMLMediaElement.prototype;
  Object.defineProperties(proto, {
    paused: { configurable: true, get() { return state(this).paused; } },
    ended: { configurable: true, get() { return state(this).ended; } },
    currentTime: { configurable: true, get() { return state(this).time; }, set(value: number) { state(this).time = value; } },
    duration: { configurable: true, get() { return state(this).duration; } },
    readyState: { configurable: true, get() { return state(this).ready; } },
  });
  proto.play = function () {
    const value = state(this); value.plays++;
    if (!value.paused) return Promise.resolve();
    value.paused = false; value.ended = false;
    queueMicrotask(() => { this.dispatchEvent(new window.Event('play')); this.dispatchEvent(new window.Event('playing')); });
    const planned = nextPlay.get(this); nextPlay.delete(this);
    return planned?.() ?? Promise.resolve();
  };
  proto.pause = function () {
    const value = state(this); if (value.paused) return;
    value.paused = true; queueMicrotask(() => this.dispatchEvent(new window.Event('pause')));
  };
  proto.load = function () {
    const video = this, value = state(video);
    if (!video.getAttribute('src')) { value.duration = NaN; value.ready = 0; return; }
    value.time = 0;
    queueMicrotask(() => {
      value.duration = 20; value.ready = 4;
      video.dispatchEvent(new window.Event('loadedmetadata')); video.dispatchEvent(new window.Event('loadeddata'));
    });
  };
  const messages: Parameters<TemplateCardsHost['sendMessage']>[0][] = [];
  const host: TemplateCardsHost = {
    getHostContext: () => ({ locale: 'en' }), getHostCapabilities: () => options.message === false ? {} : {
      message: {}, ...(options.draft === false ? {} : { experimental: { 'openai/message': {} } }),
    },
    sendMessage: message => { messages.push(message); return options.send?.(message) ?? Promise.resolve({}); },
  };
  const root = doc.createElement('main'); doc.body.append(root);
  const ui = mountTemplateCards(root as unknown as HTMLElement, bootstrap, host); ui.setConnected(true);
  const show = () => { ui.update(result()); observers.at(-1)?.emit(true); };
  return { window, doc, root, ui, observers, revoked, messages, state, show,
    get allocated() { return allocated; },
    cards: () => [...root.querySelectorAll('article video')],
    visible(value: boolean) { observers.at(-1)?.emit(value); },
    background(value: boolean) { visibility = value ? 'hidden' : 'visible'; doc.dispatchEvent(new window.Event('visibilitychange')); },
    reduce(value: boolean) { reduced = value; for (const fn of changes) fn(); },
    rejectNextPlay(video: object) {
      let reject!: (error: Error) => void;
      nextPlay.set(video, () => new Promise<void>((_, failed) => { reject = failed; }));
      return () => { const error = new Error('Interrupted by pause'); error.name = 'AbortError'; reject(error); };
    },
    end(video: HTMLVideoElement) {
      const value = state(video); value.time = value.duration; value.paused = true; value.ended = true;
      video.dispatchEvent(new window.Event('pause')); video.dispatchEvent(new window.Event('ended'));
    },
    async close() { ui.destroy(); await window.happyDOM.abort(); },
  };
}

test('onboarding welcome stays above the cards without duplicate descriptions or status prose', async () => {
  const f = fixture();
  try {
    f.ui.setHostContext({ locale: 'zh-CN' });
    f.ui.update({ ...result([0, 1, 2]), onboarding: true }); f.visible(true); await flush();
    const welcome = f.root.querySelector<HTMLElement>('.omtc-welcome')!;
    assert.ok(welcome, 'Welcome must be part of the persistent native component');
    assert.equal(f.root.firstElementChild, welcome);
    assert.equal(welcome.nextElementSibling?.className, 'omtc-list');
    assert.match(welcome.textContent!, /OpenMotion 安装好啦，右侧就是模板库/);
    assert.deepEqual([...welcome.querySelectorAll('p')].map(p => p.textContent), [
      '我是你的开源视频创作搭档，我有丰富的高水准视频模板，也支持从参考视频或一个灵感出发，和你一起创作精彩的视频。',
      '模板库支持搜索，也可以随意浏览，找到喜欢的点击「复刻模板」就能开始你的创作！',
      '不想自己找？先看看我挑的这 3 个 👇',
      '你可以点击下方卡片上的「复刻模板」，然后补充「我的要求」或添加附件，发送后就开始创作！',
    ]);
    assert.doesNotMatch(welcome.textContent!, /Motion.md|回复 1、2 或 3/);
    assert.equal(welcome.querySelectorAll('details,summary,ol,li').length, 0);
    assert.doesNotMatch(welcome.textContent!, /展示产品界面、核心卖点和品牌|已请求展示|无法独立确认/);
    assert.equal(f.root.querySelector('[data-selection-hint]'), null, 'Onboarding already includes the action guidance');
    assert.equal(f.cards().length, 3);
    for (const video of f.cards()) { assert(video.muted && video.loop); assert.equal(f.state(video).paused, false); }
    f.root.querySelector<HTMLButtonElement>('.omtc-cover')!.click();
    assert.equal(welcome.hidden, true);
    f.root.querySelector<HTMLButtonElement>('.omtc-back')!.click();
    assert.equal(welcome.hidden, false);
    f.ui.setHostContext({ locale: 'en' });
    assert.match(welcome.textContent!, /open-source video creation partner/);
    f.ui.setHostContext({ locale: 'fr-FR' });
    assert.match(welcome.textContent!, /partenaire de création vidéo/);
    f.ui.update(result());
    assert.equal(f.root.querySelector('.omtc-welcome'), null, 'Ordinary recommendation calls keep their existing presentation');
  } finally { await f.close(); }
});

test('all seven user-request languages override host locale across welcome, cards, controls and drafts', async () => {
  const cloneLabels = ['复刻模板', 'Recreate template', 'テンプレートを再現', '템플릿 재현', 'Recréer le modèle', 'Recrear plantilla', 'Recriar modelo'];
  const briefLabels = ['我的要求', 'My requirements', '私の要望', '내 요구 사항', 'Mes besoins', 'Mis requisitos', 'Meus requisitos'];
  for (const [index, language] of languages.entries()) {
    const f = fixture();
    try {
      const data = { ...result([0, 1, 2]), language, onboarding: true };
      f.ui.update(data); f.visible(true); await flush();
      f.ui.setHostContext({ locale: language === 'zh' ? 'fr-FR' : 'zh-CN', theme: 'dark' });
      assert.equal(f.root.lang, language, 'Explicit user language must survive host context changes');
      const text = translations[language];
      assert.equal(f.root.querySelector('.omtc-welcome h2')!.textContent, text.welcome.heading);
      assert.equal(f.root.querySelector('.omtc-welcome p')!.textContent, text.welcome.introduction);
      assert.deepEqual([...f.root.querySelectorAll('.omtc-description')].map(n => n.textContent), ids.map(id => text.descriptions[id as keyof typeof text.descriptions]));
      const button = f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!;
      assert.equal(button.textContent, cloneLabels[index]);
      button.click(); await flush();
      const sent = f.messages[0];
      assert.equal(sent.content[0].text, recreationPrompt(data.cards[0], language));
      assert.ok(sent.content[0].text.includes(briefLabels[index]));
      assert.ok(sent.content[0].text.includes(data.cards[0].templateId));
      assert.equal(sent._meta['openai/message'].send, false, 'Filling the composer must never submit');
      f.root.querySelector<HTMLButtonElement>('.omtc-cover')!.click();
      assert.equal(f.root.querySelector('.omtc-back')!.textContent, text.ui.back);
    } finally { await f.close(); }
    const manual = fixture({ draft: false });
    try {
      const data = { ...result(), language };
      manual.ui.update(data);
      manual.root.querySelector<HTMLButtonElement>('article .omtc-clone')!.click(); await flush();
      assert.equal(manual.messages.length, 0);
      assert.equal(manual.root.querySelector<HTMLTextAreaElement>('textarea')!.value, recreationPrompt(data.cards[0], language));
      assert.equal(manual.root.querySelector('.omtc-feedback')!.textContent, translations[language].ui.manual);
    } finally { await manual.close(); }
  }
  assert.deepEqual(['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'es-ES', 'pt-BR', 'pt-PT'].map(resolveLanguage), ['zh', 'en', 'ja', 'ko', 'fr', 'es', 'pt', 'pt']);
  assert.equal(resolveLanguage('de-DE'), 'en');
});

test('invalid resource identity, canonical data or create arguments never enable selection', async () => {
  const f = fixture();
  try {
    const mutations = [
      (input: ReturnType<typeof result>) => { Object.assign(input, { language: 'unknown' }); },
      (input: ReturnType<typeof result>) => { input.resourceVersion = 'other-resource'; },
      (input: ReturnType<typeof result>) => { input.cards[0].title = 'Different title'; },
      (input: ReturnType<typeof result>) => { input.cards[0].actionRequestId = input.cards[1].actionRequestId; },
      (input: ReturnType<typeof result>) => { input.cards[0].createArgs.requestId = '33333333-3333-4333-8333-333333333333'; },
      (input: ReturnType<typeof result>) => { Object.assign(input.cards[0].createArgs, { sessionId: 'foreign-session' }); },
      (input: ReturnType<typeof result>) => { input.cards[0].position = 2; },
    ];
    for (const mutate of mutations) {
      f.ui.update(result());
      const input = result(); mutate(input); f.ui.update(input);
      assert.equal(f.root.querySelectorAll('article').length, 0);
      assert.ok(f.root.querySelector('[role="alert"]'));
    }
    assert.equal(f.messages.length, 0);
  } finally { await f.close(); }
});

test('SDK drafts capture the exact template, never submit, suppress double clicks and ignore stale completion UI', async () => {
  let finish!: (value: {}) => void;
  const f = fixture({ send: () => new Promise(resolve => { finish = resolve; }) });
  try {
    f.show(); await flush();
    const input = result(); f.ui.update(input); input.cards[0].createArgs.requirements = 'Changed outside the component';
    const button = f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!;
    button.click(); button.click();
    assert.equal(f.messages.length, 1);
    assert.deepEqual(f.messages[0]._meta, { 'openai/message': { target: 'active', send: false } });
    assert.equal(f.messages[0].content[0].text, 'Creative brief: Use the OpenMotion plugin to create a video from the selected template, my requirements and attachments. Preserve the main animation and style by default, and deliver HTML and MP4.\n\nSelected template: Decision Tree\nTemplate ID: decision-tree\n\nMy requirements:\n');
    assert.equal(f.messages[0].content[0].text.includes('OPENMOTION_TEMPLATE_SELECTION'), false);
    f.ui.update(result([0, 1, 2], '33333333-3333-4333-8333-333333333333'));
    finish({}); await flush();
    assert.equal(f.root.textContent!.includes('Added to the composer.'), false);
    assert.equal(f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!.disabled, false);
    assert.equal(f.messages.length, 1);
  } finally { await f.close(); }
});

test('draft completion restores every button, clears feedback and permits another template', async () => {
  let finish!: (value: {}) => void;
  const f = fixture({ send: () => new Promise(resolve => { finish = resolve; }) });
  try {
    f.show();
    const buttons = [...f.root.querySelectorAll<HTMLButtonElement>('article .omtc-clone')];
    buttons[0].click(); buttons[1].click();
    assert.equal(f.messages.length, 1);
    assert.ok(buttons.every(button => button.disabled), 'prevent concurrent appends only while waiting');
    finish({}); await flush();
    assert.ok(buttons.every(button => !button.disabled), 'all templates must be usable after completion');
    assert.ok([...f.root.querySelectorAll<HTMLElement>('.omtc-feedback')].every(node => node.hidden && !node.textContent));
    buttons[1].click(); finish({}); await flush();
    assert.equal(f.messages.length, 2);
    assert.equal(f.messages[1].content[0].text, recreationPrompt(result().cards[1], 'en'));
    assert.ok(buttons.every(button => !button.disabled));
    assert.ok([...f.root.querySelectorAll<HTMLElement>('.omtc-feedback')].every(node => node.hidden));
    assert.ok(f.messages.every(message => message._meta['openai/message'].send === false));
    assert.equal(f.root.textContent!.includes('created'), false);
  } finally { await f.close(); }
});

test('each card fills its actual title and ID, and the brief format accepts catalog names', async () => {
  for (const [index, card] of result().cards.entries()) {
    const f = fixture();
    try {
      f.show(); f.root.querySelectorAll<HTMLButtonElement>('article .omtc-clone')[index].click(); await flush();
      assert.equal(f.messages[0].content[0].text, recreationPrompt(card, 'en'));
      assert.deepEqual(f.messages[0]._meta, { 'openai/message': { target: 'active', send: false } });
    } finally { await f.close(); }
  }
  const prompt = recreationPrompt({ title: 'Higgsfield API｜返现活动', templateId: 'motion-a6f31f7b-f6af-44be-8bf4-881e70057f63' });
  assert.ok(prompt.includes('指定模板：Higgsfield API｜返现活动\n模板 ID：motion-a6f31f7b-f6af-44be-8bf4-881e70057f63'));
  assert.ok(prompt.endsWith('\n\n我的要求：\n'));
});

test('the pinned real SDK preserves draft metadata on the wire and its negotiated capability', async () => {
  const messages: any[] = [];
  const transport: any = {
    start: async () => {}, close: async () => {},
    async send(message: any) {
      if (message.id === undefined) return;
      messages.push(message);
      const result = message.method === 'ui/initialize'
        ? { protocolVersion: '2026-01-26', hostInfo: { name: 'isolated-wire-test', version: '1' },
          hostCapabilities: { message: {}, experimental: { 'openai/message': {} } }, hostContext: {} }
        : {};
      queueMicrotask(() => transport.onmessage({ jsonrpc: '2.0', id: message.id, result }));
    },
  };
  const app = new App({ name: 'template-draft-wire-test', version: '1' }, {}, { autoResize: false });
  await app.connect(transport);
  const f = fixture({ send: message => app.sendMessage(message) });
  try {
    assert.deepEqual(app.getHostCapabilities()?.experimental?.['openai/message'], {});
    f.show(); f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!.click(); await flush();
    const draft = messages.find(message => message.method === 'ui/message');
    assert.deepEqual(draft.params._meta, { 'openai/message': { target: 'active', send: false } });
    assert.equal(draft.params.content[0].text, recreationPrompt(result().cards[0], 'en'));
    assert.equal(messages.filter(message => message.method === 'ui/message').length, 1);
    assert.equal(messages.some(message => message.method === 'tools/call'), false);
  } finally { await f.close(); await app.close(); }
});

test('selection feedback follows the same card when returning from detail during host confirmation', async () => {
  let finish!: (value: { isError: boolean }) => void;
  const f = fixture({ send: () => new Promise(resolve => { finish = resolve; }) });
  try {
    f.show(); await flush(); f.root.querySelector<HTMLButtonElement>('article .omtc-cover')!.click(); await flush();
    f.root.querySelector<HTMLButtonElement>('.omtc-detail .omtc-clone')!.click();
    f.root.querySelector<HTMLButtonElement>('.omtc-back')!.click();
    assert.equal(f.root.querySelector('article .omtc-feedback')!.textContent, 'Adding to composer…');
    finish({ isError: true }); await flush();
    assert.ok(f.root.querySelector('article .omtc-feedback')!.textContent!.includes('Not added.'));
  } finally { await f.close(); }
});

test('host rejection, cancellation and transport errors retain the same retry identity', async () => {
  for (const send of [async () => ({ isError: true }), async () => ({ cancelled: true }), async () => { throw new Error('Disconnected'); }]) {
    const f = fixture({ send });
    try {
      f.show(); const button = f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!;
      button.click(); await flush();
      assert.ok(f.root.textContent!.includes('Not added.'));
      button.click(); await flush();
      assert.equal(f.messages.length, 2);
      assert.equal(f.messages[0].content[0].text, f.messages[1].content[0].text);
    } finally { await f.close(); }
  }
});

test('a host without draft support never receives a message that could auto-submit', async () => {
  for (const options of [{ message: false }, { draft: false }]) {
    const f = fixture(options);
    try {
      f.show(); f.root.querySelector<HTMLButtonElement>('article .omtc-clone')!.click(); await flush();
      assert.equal(f.messages.length, 0);
      const draft = f.root.querySelector<HTMLTextAreaElement>('.omtc-draft')!;
      assert.equal(draft.readOnly, true);
      assert.ok(draft.value.includes('Selected template: Decision Tree\nTemplate ID: decision-tree'));
      assert.ok(draft.value.endsWith('My requirements:\n'));
    } finally { await f.close(); }
  }
});

test('viewport and document pauses do not become manual pauses, but a manual pause persists', async () => {
  const f = fixture();
  try {
    f.show(); await flush();
    assert.ok(f.cards().every(video => !video.paused && video.muted && video.loop));
    f.visible(false); f.visible(true); await flush();
    assert.ok(f.cards().every(video => !video.paused));
    f.cards()[0].pause(); await flush();
    f.background(true); await flush(); assert.ok(f.cards().every(video => video.paused));
    f.background(false); await flush();
    assert.equal(f.cards()[0].paused, true);
    assert.ok(f.cards().slice(1).every(video => !video.paused));
    f.visible(false); await flush(); f.visible(true); await flush();
    assert.equal(f.cards()[0].paused, true);
  } finally { await f.close(); }
});

test('reduced motion keeps posters until deliberate playback and preserves the selected manual pause', async () => {
  const f = fixture({ reduced: true });
  try {
    f.show(); await flush(); assert.ok(f.cards().every(video => video.paused));
    assert.ok([...f.root.querySelectorAll('article')].every(card => card.getAttribute('data-media-ready') === 'false'));
    f.root.querySelector<HTMLButtonElement>('article .omtc-cover')!.click(); await flush();
    const detail = f.root.querySelector<HTMLVideoElement>('.omtc-player')!;
    assert.equal(detail.paused, true);
    await detail.play(); await flush(); assert.equal(detail.paused, false);
    detail.pause(); await flush(); f.root.querySelector<HTMLButtonElement>('.omtc-back')!.click(); await flush();
    f.reduce(false); await flush();
    assert.equal(f.cards()[0].paused, true);
    assert.ok(f.cards().slice(1).every(video => !video.paused));
  } finally { await f.close(); }
});

test('a lifecycle pause that aborts pending playback can recover without a false media failure', async () => {
  const f = fixture();
  try {
    f.ui.update(result()); await flush();
    const reject = f.rejectNextPlay(f.cards()[0]);
    f.visible(true); f.visible(false); f.visible(true); reject(); await flush();
    assert.ok(f.cards().every(video => !video.paused));
    assert.equal(f.root.textContent!.includes('cannot play'), false);
    assert.equal(f.root.textContent!.includes('larger preview to play'), false);
  } finally { await f.close(); }
});

test('failed connection without a tool result gives a truthful fallback instead of endless preparation', async () => {
  const f = fixture();
  try {
    f.ui.setConnected(false);
    assert.ok(f.root.querySelector('[role="alert"]'));
    assert.equal(f.root.querySelectorAll('article').length, 0);
    assert.equal(f.messages.length, 0);
  } finally { await f.close(); }
});

test('detail preview pauses the list, returns the position and restores keyboard focus', async () => {
  const f = fixture();
  try {
    f.show(); await flush();
    const cover = f.root.querySelector<HTMLButtonElement>('article .omtc-cover')!;
    f.cards()[0].currentTime = 6.25; cover.click(); await flush();
    assert.ok(f.cards().every(video => video.paused));
    const detail = f.root.querySelector<HTMLVideoElement>('.omtc-player')!;
    assert.equal(detail.currentTime, 6.25); assert.equal(detail.paused, false);
    detail.currentTime = 8.5; detail.pause(); await flush();
    f.root.dispatchEvent(new f.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flush();
    assert.equal(f.root.querySelector<HTMLElement>('.omtc-detail')!.hidden, true);
    assert.equal(f.cards()[0].currentTime, 8.5); assert.equal(f.cards()[0].paused, true);
    assert.ok(f.cards().slice(1).every(video => !video.paused));
    assert.equal(f.doc.activeElement, cover);
  } finally { await f.close(); }
});

test('natural completion of detail is not a manual pause and returning resumes the looping card', async () => {
  const f = fixture();
  try {
    f.show(); await flush(); f.root.querySelector<HTMLButtonElement>('article .omtc-cover')!.click(); await flush();
    const player = f.root.querySelector<HTMLVideoElement>('.omtc-player')!;
    f.end(player); f.root.querySelector<HTMLButtonElement>('.omtc-back')!.click(); await flush();
    assert.equal(f.cards()[0].currentTime, 0);
    assert.ok(f.cards().every(video => !video.paused));
  } finally { await f.close(); }
});

test('identical results preserve players; replacement and teardown release each Blob once', async () => {
  const f = fixture();
  try {
    f.show(); await flush(); const video = f.cards()[0]; video.currentTime = 9;
    f.ui.update(result()); await flush();
    assert.equal(f.cards()[0], video); assert.equal(video.currentTime, 9); assert.equal(f.allocated, 3);
    const oldObserver = f.observers[0];
    f.ui.update(result([0, 1, 2], '33333333-3333-4333-8333-333333333333')); await flush();
    assert.equal(oldObserver.disconnected, true); assert.equal(f.allocated, 6); assert.equal(f.revoked.length, 3);
    f.ui.destroy(); f.ui.destroy();
    assert.equal(f.revoked.length, 6); assert.equal(new Set(f.revoked).size, 6);
    assert.equal(f.root.children.length, 0);
  } finally { await f.close(); }
});

test('stale detail/media events and a pending host completion cannot mutate a replacement or disposed app', async () => {
  let finish!: (value: {}) => void;
  const f = fixture({ send: () => new Promise(resolve => { finish = resolve; }) });
  try {
    f.show(); await flush();
    f.root.querySelector<HTMLButtonElement>('article .omtc-cover')!.click();
    const oldPlayer = f.root.querySelector<HTMLVideoElement>('.omtc-player')!;
    f.root.querySelector<HTMLButtonElement>('.omtc-detail .omtc-clone')!.click();
    f.ui.update(result([0, 1, 2], '33333333-3333-4333-8333-333333333333'));
    oldPlayer.dispatchEvent(new f.window.Event('loadedmetadata'));
    oldPlayer.dispatchEvent(new f.window.Event('error'));
    await flush(); assert.equal(f.root.querySelector<HTMLElement>('.omtc-detail')!.hidden, true);
    assert.equal(f.root.textContent!.includes('cannot play'), false);
    f.ui.destroy(); finish({}); await flush(); assert.equal(f.root.children.length, 0);
  } finally { await f.close(); }
});
