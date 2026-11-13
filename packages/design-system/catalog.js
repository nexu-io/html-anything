import { pages, entries, components, tokenValue, references, applyChanges, mergeDraft, validateValue, sourcePath } from './token-model.js';
import { renderDesignTokens } from './generate.js';
import { renderPage, escape, icon } from './catalog-view.js';

const $ = selector => document.querySelector(selector);
const editable = $('meta[name="design-system-editable"]').content === 'true';
const state = { source: null, draft: null, changes: new Map(), latest: null, selected: 'light/accent', page: 'colors', theme: 'light', query: '', icons: [], saving: false, polling: false, invalid: new Set() };
try { state.theme = localStorage.getItem('design-system.theme') === 'dark' ? 'dark' : 'light'; } catch {}
state.selected = `${state.theme}/accent`;
let noticeTimer, merge;
const changes = () => [...state.changes].map(([id, value]) => ({ id, value }));
function notify(message, error = false) {
  clearTimeout(noticeTimer); $('#notice').hidden = false; $('#notice').textContent = message; $('#notice').dataset.error = String(error);
  if (!error) noticeTimer = setTimeout(() => { $('#notice').hidden = true; }, 6000);
}
async function copy(text, message) {
  try { await navigator.clipboard.writeText(text); notify(message); }
  catch { notify('无法访问剪贴板。请使用导出 Tokens 下载当前设计变量。', true); }
}
function applyPreview() {
  document.documentElement.dataset.theme = state.theme;
  const values = { ...state.draft.shared, ...state.draft.themes[state.theme] };
  for (const property of [...document.documentElement.style]) if (property.startsWith('--motion-') && !Object.hasOwn(values, property.slice(9))) document.documentElement.style.removeProperty(property);
  for (const [key, value] of Object.entries(values)) document.documentElement.style.setProperty(`--motion-${key}`, value);
  for (const button of document.querySelectorAll('button[data-theme]')) button.setAttribute('aria-pressed', String(button.dataset.theme === state.theme));
}
function updateStatus() {
  const count = state.changes.size;
  $('#change-count').textContent = count;
  $('#review').disabled = !count || state.saving;
  $('#discard').disabled = state.saving;
  $('#sync').disabled = state.saving;
  for (const input of document.querySelectorAll('[data-value], [data-color]')) input.disabled = state.saving;
  $('#save').disabled = !editable || !count || state.saving || !!state.latest || state.invalid.size > 0;
  $('#confirm-save').disabled = $('#save').disabled;
  $('#save').textContent = state.saving ? '正在保存…' : '保存到源码';
  $('#save-state').textContent = !editable ? '只读展示 · 可预览与导出' : state.latest ? '源码有更新' : state.invalid.size ? '请检查样式值' : count ? `${count} 项未保存` : '已与源码同步';
  $('#conflict-banner').hidden = !state.latest;
}
function renderContent() {
  $('#content').innerHTML = renderPage({ tokens: state.draft, theme: state.theme, page: state.page, selected: state.selected, query: state.query, icons: state.icons });
  $('#breadcrumb-page').textContent = pages.find(page => page.id === state.page)?.title || '颜色';
  $('#navigation').innerHTML = pages.map(page => `<a class="nav-item" href="#/${page.id}" ${page.id === state.page ? 'aria-current="page"' : ''}>${icon(page.icon)}<span>${page.title}</span></a>`).join('');
  applyPreview();
}
const propertyFor = entry => ({ color: 'color', length: 'width', duration: 'transition-duration', font: 'font-family', weight: 'font-weight', number: 'line-height', easing: 'transition-timing-function', shadow: 'box-shadow', effect: entry.key.includes('backdrop') ? 'backdrop-filter' : 'background' })[entry.kind];
function field(entry) {
  if (!entry) return '';
  const readOnly = entry.kind === 'reference';
  return `<label class="ui-field">${escape(entry.label)}<span class="value-editor">${entry.kind === 'color' ? `<input class="color-picker" type="color" value="${entry.value.slice(0,7)}" data-color="${entry.id}" aria-label="${escape(entry.key)} 颜色选择器" />` : ''}<input class="ui-input" data-value="${entry.id}" aria-label="${escape(entry.key)} 值" aria-describedby="error-${entry.id.replace('/','-')}" value="${escape(entry.value)}" ${readOnly ? 'readonly' : ''} ${state.saving ? 'disabled' : ''} spellcheck="false" /></span><span class="field-error" id="error-${entry.id.replace('/','-')}" data-error-for="${entry.id}"></span></label>`;
}
function renderInspector() {
  state.invalid.clear(); updateStatus();
  const all = entries(state.draft, state.theme);
  if (state.selected.startsWith('component/')) {
    const component = components.find(value => value.id === state.selected.split('/')[1]);
    $('#inspector').innerHTML = `<span class="eyebrow">COMPONENT STYLES</span><h2>${component.title}</h2><p class="inspector-subtitle">修改共享变量，也会影响引用同一变量的其他组件。</p><code class="property-code">${component.selector}</code>${component.fields.map(key => field(all.find(entry => entry.key === key))).join('')}<p class="inspector-subtitle">布局与组件结构由 Agent 在设计系统的 controls.css 中维护。</p>`;
    return;
  }
  const entry = all.find(value => value.id === state.selected);
  if (!entry) { $('#inspector').innerHTML = '<span class="eyebrow">STYLE INSPECTOR</span><h2>选择一个设计变量</h2><p class="inspector-subtitle">点击颜色、字体、圆角或组件，在这里修改并即时预览。</p>'; return; }
  const impact = references(state.draft, entry.key);
  const sample = entry.kind === 'color' ? `background:var(${entry.css})` : entry.key.startsWith('radius') ? `border-radius:var(${entry.css});background:var(--motion-accent-soft)` : entry.kind === 'font' ? `font-family:var(${entry.css})` : entry.key.startsWith('text') ? `font-size:var(${entry.css})` : '';
  $('#inspector').innerHTML = `<span class="eyebrow">STYLE INSPECTOR</span><h2>${escape(entry.label)}</h2><p class="inspector-subtitle">${entry.id.startsWith('shared/') ? '共享变量 · 同时影响浅色与深色' : state.theme === 'light' ? '浅色模式 · 深色模式单独保存' : '深色模式 · 浅色模式单独保存'}</p><div class="inspector-sample" style="${sample}">${entry.kind === 'color' ? '' : 'Aa'}</div>${field(entry)}<code class="property-code">${entry.css}</code><button class="text-button" data-reset="${entry.id}">恢复源码中的值</button><div class="inspector-details"><h3>引用与影响</h3><p class="inspector-subtitle">所有使用此 CSS 变量的界面都会继承修改。以下列出包内的语义映射与通用组件。</p><div class="impact-list">${impact.length ? impact.map(value => `<code>${escape(value)}</code>`).join('') : '<code>通过 CSS 变量统一引用</code>'}</div></div>`;
}
function render() { renderContent(); renderInspector(); updateStatus(); }
function acceptSnapshot(snapshot) {
  state.source = snapshot; state.draft = structuredClone(snapshot.tokens); state.latest = null;
  state.changes.clear(); state.invalid.clear(); render();
}
function updateValue(id, value) {
  if (state.saving) return;
  const key = id.split('/')[1], before = tokenValue(state.source.tokens, id);
  const entry = entries(state.draft, state.theme).find(item => item.id === id);
  let error = validateValue(key, value.trim(), before);
  const property = entry && propertyFor(entry);
  if (!error && property && !CSS.supports(property, value.trim())) error = '浏览器无法识别这个样式值，请检查单位或格式。';
  const proposed = new Map(state.changes);
  if (value.trim() === before) proposed.delete(id); else proposed.set(id, value.trim());
  let draft;
  if (!error) {
    try { draft = proposed.size ? applyChanges(state.source.tokens, [...proposed].map(([id, value]) => ({ id, value }))) : structuredClone(state.source.tokens); }
    catch (cause) { error = cause.message; }
  }
  const errorElement = [...document.querySelectorAll('[data-error-for]')].find(element => element.dataset.errorFor === id);
  if (errorElement) errorElement.textContent = error || '';
  const input = [...document.querySelectorAll('[data-value]')].find(element => element.dataset.value === id);
  input?.setAttribute('aria-invalid', String(!!error));
  if (error) { state.invalid.add(id); updateStatus(); return; }
  state.invalid.delete(id); state.changes = proposed; state.draft = draft;
  renderContent(); updateStatus();
  const picker = [...document.querySelectorAll('[data-color]')].find(element => element.dataset.color === id);
  if (picker && /^#[a-f0-9]{6}/i.test(value)) picker.value = value.slice(0,7);
}
async function poll(initial = false) {
  if (state.polling || state.saving || !editable && !initial) return;
  state.polling = true;
  try {
    const response = await fetch(editable ? '/api/design-system' : '/design-system/tokens.json', { cache: 'no-store', headers: state.source && editable ? { 'If-None-Match': `"${state.source.revision}"` } : {} });
    if (response.status === 304) return;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '无法读取设计系统源码。');
    const snapshot = editable ? data : { tokens: data, revision: 'static' };
    if (!state.source || (!state.changes.size && !state.invalid.size)) {
      const external = !!state.source; acceptSnapshot(snapshot);
      if (external) notify('已载入源码中的最新修改。');
    } else if (snapshot.revision !== state.source.revision) { state.latest = snapshot; updateStatus(); }
  } catch (error) {
    notify(error.message + ' 页面中的草稿仍然保留。', true);
    if (initial) { $('#content').textContent = '无法加载设计系统。检查本地服务和 tokens.json 后刷新页面。'; $('#save-state').textContent = '读取失败'; }
  } finally { state.polling = false; }
}
function review() {
  $('#changes-list').innerHTML = changes().map(change => `<div class="change-row"><code>${escape(change.id)} · --motion-${escape(change.id.split('/')[1])}</code><div class="change-values"><del>${escape(tokenValue(state.source.tokens, change.id))}</del><span>→</span><ins>${escape(change.value)}</ins></div></div>`).join('');
  $('#review-dialog').showModal(); updateStatus();
}
async function save() {
  if ($('#save').disabled) return;
  state.saving = true; updateStatus();
  try {
    const response = await fetch('/api/design-system/tokens', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Design-System-Client': 'workbench' }, body: JSON.stringify({ expectedRevision: state.source.revision, changes: changes() }) });
    const result = await response.json();
    if (response.status === 409) { if (result.latest) state.latest = result.latest; else { state.saving = false; await poll(); } }
    if (!response.ok) throw new Error(result.error || '保存失败。');
    acceptSnapshot(result); $('#review-dialog').close();
    notify('已保存到 tokens.json，并更新共享 CSS。引用这些样式的模块会在刷新或重新构建后使用新设计。');
  } catch (error) { notify(error.message, true); }
  finally { state.saving = false; updateStatus(); }
}
function finishMerge(resolved) {
  const snapshot = merge.snapshot;
  let draft;
  try { draft = resolved.length ? applyChanges(snapshot.tokens, resolved) : structuredClone(snapshot.tokens); }
  catch (error) { notify(`无法合并：${error.message}`, true); return; }
  state.source = snapshot; state.latest = null; state.changes = new Map(resolved.map(item => [item.id, item.value])); state.invalid.clear();
  state.draft = draft;
  render(); $('#conflict-dialog').close(); $('#review-dialog').close(); notify('已同步最新源码。合并后的草稿可以继续编辑和保存。');
}
function sync() {
  if (!state.latest) return;
  merge = { ...mergeDraft(state.source.tokens, state.latest.tokens, changes()), snapshot: state.latest };
  if (!merge.conflicts.length) return finishMerge(merge.changes);
  $('#conflicts-list').innerHTML = merge.conflicts.map((item, index) => `<fieldset class="conflict-row"><legend>${escape(item.id)}</legend><label><input type="radio" name="conflict-${index}" value="source" checked /> 源码：${escape(item.current ?? '变量已删除')}</label><label><input type="radio" name="conflict-${index}" value="draft" ${item.current === undefined ? 'disabled' : ''} /> 我的草稿：${escape(item.value)}</label></fieldset>`).join('');
  $('#conflict-dialog').showModal();
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function route() {
  const target = location.hash.replace(/^#\/?/, '');
  state.page = pages.some(page => page.id === target) ? target : 'colors';
  state.query = ''; $('#search').value = '';
  if (state.draft) { renderContent(); window.scrollTo({ top: 0 }); }
}
document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) { event.preventDefault(); $('#content').focus(); return; }
  const theme = event.target.closest('button[data-theme]');
  if (theme && state.draft) {
    const previous = state.theme; state.theme = theme.dataset.theme;
    if (state.selected.startsWith(previous + '/')) state.selected = state.theme + state.selected.slice(previous.length);
    try { localStorage.setItem('design-system.theme', state.theme); } catch {}
    render();
  }
  const token = event.target.closest('[data-token]'), component = event.target.closest('[data-component]');
  if (token || component) {
    state.selected = token ? token.dataset.token : `component/${component.dataset.component}`;
    state.invalid.clear(); renderInspector(); updateStatus();
    for (const card of document.querySelectorAll('[data-token]')) card.setAttribute('aria-pressed', String(card.dataset.token === state.selected));
    for (const card of document.querySelectorAll('[data-component-card]')) card.dataset.selected = String(`component/${card.dataset.componentCard}` === state.selected);
    if (matchMedia('(max-width: 600px)').matches) $('.inspector').scrollIntoView({ behavior: 'smooth' });
  }
  const reset = event.target.closest('[data-reset]');
  if (reset) { updateValue(reset.dataset.reset, tokenValue(state.source.tokens, reset.dataset.reset)); renderInspector(); }
  const iconButton = event.target.closest('[data-icon]');
  if (iconButton) copy(icon(iconButton.dataset.icon), '已复制 SVG 图标引用。');
  event.target.closest('[data-close]')?.closest('dialog').close();
});
document.addEventListener('input', event => {
  if (event.target.dataset.value) updateValue(event.target.dataset.value, event.target.value);
  if (event.target.dataset.color) {
    const id = event.target.dataset.color, current = tokenValue(state.draft, id);
    const value = event.target.value + (current.length === 9 ? current.slice(7) : '');
    const input = [...document.querySelectorAll('[data-value]')].find(element => element.dataset.value === id);
    if (input) input.value = value; updateValue(id, value);
  }
});
$('#search').addEventListener('input', event => { state.query = event.target.value; if (state.draft) renderContent(); });
$('#review').addEventListener('click', review);
$('#save').addEventListener('click', review);
$('#confirm-save').addEventListener('click', save);
$('#discard').addEventListener('click', () => { acceptSnapshot(state.latest || state.source); $('#review-dialog').close(); notify('已放弃草稿，恢复源码中的设计。'); });
$('#sync').addEventListener('click', sync);
$('#resolve').addEventListener('click', () => finishMerge([...merge.changes, ...merge.conflicts.filter((_, index) => $(`input[name="conflict-${index}"]:checked`).value === 'draft').map(({ id, value }) => ({ id, value }))]));
$('#agent-prompt').addEventListener('click', () => copy(`Update the shared OpenMotion design system in packages/design-system. Read AGENTS.md and packages/design-system/README.md first. Edit ${sourcePath} for colors, fonts, radius, spacing and motion. Use package-owned controls.css or other shared styles for component structure. Regenerate with npm run design:tokens and run npm run design:check and npm run design:test. Keep the workbench independent of Studio and all business modules. Never introduce duplicate styling in consumers. Current selection: ${state.selected}.`, '已复制 Agent 修改说明。'));
$('#export').addEventListener('click', () => { if (state.draft) download('openmotion-design.tokens.json', JSON.stringify(state.draft, null, 2) + '\n', 'application/json'); });
$('#export-css').addEventListener('click', () => { if (state.draft) download('openmotion-design.tokens.css', renderDesignTokens(state.draft)['tokens.css'], 'text/css'); });
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', event => { if (state.changes.size || state.invalid.size) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.target.closest('input, textarea, select') && !document.querySelector('dialog[open]')) { event.preventDefault(); $('#search').focus(); }
});
route();
try {
  const response = await fetch('/design-system/icons.svg');
  const sprite = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  state.icons = [...sprite.querySelectorAll('symbol[id^="icon-"]')].map(element => element.id.slice(5)).filter(name => !name.startsWith('ri-'));
} catch { /* The rest of the catalog still works when an optional icon preview is unavailable. */ }
await poll(true);
if (!editable) notify('当前是只读展示，可编辑预览并导出。要保存回源码，请在源码仓库的设计系统 package 内运行 npm run dev。');
setInterval(() => { if (!document.hidden) poll(); }, 2000);
