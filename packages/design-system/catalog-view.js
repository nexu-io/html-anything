import { pages, entries, colorGroups, components } from './token-model.js';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const icon = name => `<svg class="ui-icon" aria-hidden="true"><use href="/design-system/icons.svg#icon-${escape(name)}" /></svg>`;
export const themes = theme => `<div class="theme-switch" role="group" aria-label="预览主题"><button data-theme="light" aria-pressed="${theme === 'light'}">☀ 浅色模式</button><button data-theme="dark" aria-pressed="${theme === 'dark'}">☾ 深色模式</button></div>`;
const meta = entry => `<span class="token-name">${escape(entry.label)}</span><span class="token-meta">${escape(entry.key)}</span><span class="token-meta">${escape(entry.value)}</span>`;
const card = (entry, sample, selected, classes = '') => `<button class="token-card ${classes}" data-token="${escape(entry.id)}" aria-label="编辑 ${escape(entry.key)}" aria-pressed="${selected === entry.id}">${sample}${meta(entry)}</button>`;
const section = (title, note, content, count = '') => `<section class="token-section"><div class="section-head"><h2>${escape(title)}</h2><span>${count}</span></div><p class="section-note">${escape(note)}</p>${content}</section>`;
export const loader = `<span class="ui-loader" role="img" aria-label="正在加载">${'<i></i>'.repeat(25)}</span>`;
const previews = {
  button: `<button class="ui-button ui-button--primary">主要操作</button><button class="ui-button">次要操作</button><button class="ui-button ui-button--ghost">轻量操作</button><button class="ui-button ui-button--accent">${icon('sparkles')}开始创作</button><button class="ui-button" disabled>不可用</button>`,
  input: `<label class="ui-field">名称<input class="ui-input" placeholder="写下你的下一个想法" /></label><label class="ui-field">选择<select class="ui-input"><option>默认选项</option><option>另一种可能</option></select></label>`,
  badge: `<span class="ui-badge">默认</span><span class="ui-badge ui-badge--accent">已选中</span><span class="ui-badge ui-badge--success">已完成</span><span class="ui-badge ui-badge--warning">待检查</span><span class="ui-badge ui-badge--danger">未完成</span>`,
  empty: `<div class="ui-empty">${icon('image')}<span>在这里，开始新的创作</span><button class="ui-button">添加内容</button></div>`,
  loading: `${loader}<span>正在整理你的灵感</span><progress class="ui-progress" max="1" value="0.6" aria-label="进度预览"></progress>`,
};
const componentCards = (items, selected) => `<div class="component-grid">${items.map(component => `<article class="component-card" data-component-card="${component.id}" data-selected="${selected === `component/${component.id}`}"><div class="component-preview">${previews[component.id]}</div><div class="component-caption"><div><h2>${component.title}</h2><p>${component.description}</p></div><button class="ui-button ui-button--sm" data-component="${component.id}">编辑样式 ${icon('sliders')}</button></div></article>`).join('')}</div>`;
export function renderPage({ tokens, theme, page, selected, query, icons }) {
  const all = entries(tokens, theme), find = key => all.find(entry => entry.key === key);
  const match = entry => `${entry.label} ${entry.key} ${entry.value}`.toLowerCase().includes(query.toLowerCase());
  const filtered = all.filter(match), definition = pages.find(item => item.id === page) || pages[1];
  let content = '';
  if (query) {
    const matches = components.filter(item => `${item.title} ${item.id} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
    content = section('搜索结果', `“${query}”`, filtered.length ? `<div class="type-list">${filtered.map(entry => card(entry, entry.kind === 'color' ? `<span class="color-sample" style="background:var(${entry.css})"></span>` : '', selected, 'type-card')).join('')}</div>` : '<p class="empty-search">没有找到匹配的变量。试试「radius」「文字」或「accent」。</p>', filtered.length);
    if (matches.length) content = section('组件', '修改组件使用的共享变量。', componentCards(matches, selected), matches.length) + content;
  } else if (page === 'colors') {
    const covered = new Set(colorGroups.flatMap(group => group.keys));
    const groups = [...colorGroups, { title: '其他语义色', note: '叠层、装饰与专用状态的共享颜色。', keys: all.filter(entry => entry.kind === 'color' && !covered.has(entry.key)).map(entry => entry.key) }];
    content = groups.map(group => section(group.title, group.note, `<div class="swatches">${group.keys.map(find).filter(Boolean).map(entry => card(entry, `<span class="color-sample" style="background:var(${entry.css})"></span>`, selected)).join('')}</div>`, group.keys.length)).join('');
  } else if (page === 'radius') {
    content = section('圆角比例', '点击任一规格，在右侧编辑。使用该变量的所有组件会同步变化。', `<div class="token-grid">${all.filter(entry => entry.key.startsWith('radius-')).map(entry => card(entry, `<span class="geometry-sample"><span class="radius-sample" style="border-radius:var(${entry.css})"></span></span>`, selected)).join('')}</div>`);
  } else if (page === 'type') {
    content = [['字体', 'font-'], ['字号', 'text-'], ['字重', 'weight-'], ['行高', 'leading-']].map(([title, prefix]) => section(title, title === '字体' ? '已内置 Albert Sans 与 IBM Plex Mono。新增字体需同时提供字体资源与回退方案。' : '共享文字层级', `<div class="type-list">${all.filter(entry => entry.key.startsWith(prefix)).map(entry => {
      const prop = { 'font-': 'font-family', 'text-': 'font-size', 'weight-': 'font-weight', 'leading-': 'line-height' }[prefix];
      return card(entry, `<span class="type-sample" style="${prop}:var(${entry.css})">${prefix === 'leading-' ? 'Every idea starts here.<br>每一种想法，都值得被看见。' : '给创作，留出空间。 Aa'}</span>`, selected, 'type-card');
    }).join('')}</div>`)).join('');
  } else if (page === 'spacing') {
    content = section('间距与尺寸', '一致的间距建立界面的秩序。尺寸单位保留在源码中。', `<div class="type-list">${all.filter(entry => /^(space-|control$|control-sm$|icon$|icon-button$|topbar$|panel-header$)/.test(entry.key)).sort((a,b) => parseFloat(a.value) - parseFloat(b.value)).map(entry => `<button class="token-card spacing-card" data-token="${entry.id}" aria-label="编辑 ${entry.key}" aria-pressed="${selected === entry.id}"><span class="token-name">${escape(entry.key)}</span><span class="spacing-bar" style="width:var(${entry.css})"></span><span class="token-meta">${escape(entry.value)}</span></button>`).join('')}</div>`);
  } else if (page === 'components') {
    content = componentCards(components, selected);
  } else if (page === 'brand') {
    content = `<div class="brand-hero"><img src="/design-system/opendesign-${theme === 'dark' ? 'light' : 'dark'}.svg" alt="OpenDesign" /></div>${section('品牌资源', '统一使用源文件。品牌图形由 Agent 在设计系统 package 内维护。', `<div class="asset-row"><img src="/design-system/brand/favicon.svg" alt=""/><span>OpenMotion 标识</span><a class="ui-button ui-button--sm" href="/design-system/brand/openmotion-logo.svg" download>下载 SVG</a></div><div class="asset-row">${loader}<span>Loading mark</span><a class="ui-button ui-button--sm" href="/design-system/brand/loading-mark.svg" download>下载 SVG</a></div>`)}${section('品牌色', '共享品牌变量，在每个使用它的界面生效。', `<div class="swatches">${['brand','accent','strong','bg'].map(find).map(entry => card(entry, `<span class="color-sample" style="background:var(${entry.css})"></span>`, selected)).join('')}</div>`)}`;
  } else if (page === 'icons') {
    content = section('界面图标', '点击复制 SVG 引用。图标源文件与许可随设计系统一同维护。', `<div class="icon-grid">${icons.map(name => `<button class="icon-card" data-icon="${escape(name)}" aria-label="复制 ${escape(name)} 图标">${icon(name)}<small>${escape(name)}</small></button>`).join('')}</div>`, icons.length);
  } else if (page === 'material') {
    content = section('材质与层次', '阴影和浮层同样引用共享主题。', `<div class="token-grid">${all.filter(entry => ['shadow', 'effect'].includes(entry.kind)).map(entry => card(entry, `<span class="geometry-sample" style="${entry.kind === 'shadow' ? 'box-shadow' : entry.key.includes('backdrop') ? 'backdrop-filter' : 'background'}:var(${entry.css})">Aa</span>`, selected)).join('')}</div>`);
  } else if (page === 'motion') {
    content = section('节奏与曲线', '悬停或用键盘聚焦预览动画。系统的减少动态效果设置优先。', `<div class="token-grid">${all.filter(entry => /^(duration-|ease-)/.test(entry.key)).map(entry => card(entry, `<span class="motion-track"><span class="motion-dot" style="${entry.kind === 'duration' ? 'transition-duration' : 'transition-timing-function'}:var(${entry.css})"></span></span>`, selected)).join('')}</div>`) + section('加载语言', '同一套点阵反馈，贯穿设计系统。', `<div class="component-preview">${loader}<span>让灵感慢慢成形</span></div>`);
  }
  return `<div class="page-heading"><span class="eyebrow">OPENMOTION DESIGN SYSTEM / ${String(pages.indexOf(definition) + 1).padStart(2,'0')}</span><h1>${query ? '搜索设计系统' : definition.title}</h1><p>${query ? '从名称、语义和当前值查找共享变量。' : definition.subtitle}</p>${themes(theme)}</div>${content}`;
}
