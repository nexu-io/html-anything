/** Package-owned presentation metadata. No application, framework or server dependency. */
export const pages = [
  { id: 'brand', title: 'Brand', subtitle: '品牌标识与资源', icon: 'sparkles' },
  { id: 'colors', title: '颜色', subtitle: '让层次清晰，让重点自然浮现。', icon: 'sliders' },
  { id: 'radius', title: '圆角', subtitle: '从紧凑控件到柔和容器，共用一套几何语言。', icon: 'maximize' },
  { id: 'type', title: '文本', subtitle: '字体、字号与字重，构成清晰的阅读节奏。', icon: 'subtitles' },
  { id: 'spacing', title: '间距', subtitle: '用一致的留白组织内容与关系。', icon: 'sliders' },
  { id: 'components', title: '组件库', subtitle: '真实组件，共享变量。每一次调整都可以即时看见。', icon: 'grid' },
  { id: 'icons', title: '图标', subtitle: '统一的图形语言，保持清晰与克制。', icon: 'sparkles' },
  { id: 'material', title: '材质', subtitle: '阴影、浮层与透明度，让界面拥有层次。', icon: 'layers' },
  { id: 'motion', title: '动效', subtitle: '让反馈及时，让过渡自然。', icon: 'play' },
];
export const labels = {
  bg: '页面背景', panel: '面板背景', raised: '浮层背景', inset: '嵌入底色', hover: '悬停底色',
  border: '默认边框', 'border-strong': '强调边框', strong: '强调文字', text: '正文文字', muted: '次要文字',
  dim: '辅助文字', placeholder: '占位文字', brand: '品牌绿', accent: '强调色', 'accent-hover': '强调悬停',
  'accent-soft': '强调底色', 'brand-soft': '品牌底色', highlight: '高亮底色', action: '主要操作',
  'action-hover': '主要操作悬停', 'on-action': '主要操作文字', success: '成功', danger: '错误',
  'danger-soft': '错误底色', warning: '警告', 'warning-soft': '警告底色', selected: '选中边框',
  'font-sans': '界面字体', 'font-mono': '等宽字体', 'font-display': '展示字体',
  'radius-xs': '微小圆角', 'radius-sm': '控件圆角', 'radius-md': '卡片圆角', 'radius-lg': '弹窗圆角',
  'radius-xl': '大容器圆角', 'radius-full': '全圆角', control: '标准控件高度', 'control-sm': '紧凑控件高度',
  'text-xs': '微小文字', 'text-sm': '辅助文字', 'text-md': '控件文字', 'text-body': '正文',
  'text-heading': '小标题', 'text-title': '标题', 'text-section': '章节标题', 'text-display': '展示标题',
  'duration-fast': '快速反馈', 'duration-normal': '常规过渡', 'duration-slow': '舒缓过渡',
  'duration-loading': '加载周期', 'ease-out': '自然减速', 'ease-standard': '标准曲线',
};
export const colorGroups = [
  { title: '中性色', note: '背景、边框与文字，共同构成界面的基本层次。', keys: ['bg', 'panel', 'raised', 'inset', 'hover', 'border', 'border-strong', 'strong', 'text', 'muted', 'dim', 'placeholder'] },
  { title: '品牌与交互', note: '中性操作与克制的绿色，表达状态和重点。', keys: ['brand', 'accent', 'accent-hover', 'accent-soft', 'brand-soft', 'highlight', 'action', 'action-hover', 'on-action', 'selected'] },
  { title: '功能色', note: '让成功、警告和错误拥有明确的语义。', keys: ['success', 'danger', 'danger-soft', 'warning', 'warning-soft'] },
];
export const components = [
  { id: 'button', title: '按钮', description: '主要、次要与轻量操作', fields: ['action', 'on-action', 'action-hover', 'radius-sm', 'control', 'text-md', 'weight-semibold', 'space-12'], selector: '.ui-button' },
  { id: 'input', title: '输入框', description: '文本、选择与键盘焦点', fields: ['panel', 'text', 'border', 'selected', 'radius-sm', 'control', 'space-10', 'text-md'], selector: '.ui-input' },
  { id: 'badge', title: '标签', description: '轻量信息与语义状态', fields: ['accent', 'accent-soft', 'radius-full', 'text-xs', 'weight-medium', 'space-8'], selector: '.ui-badge' },
  { id: 'empty', title: '空状态', description: '引导下一步，而不打断当前任务', fields: ['dim', 'border', 'radius-md', 'space-24', 'text-sm'], selector: '.ui-empty' },
  { id: 'loading', title: '加载反馈', description: '点阵与进度，尊重减少动态效果偏好', fields: ['accent', 'duration-loading', 'ease-out', 'radius-full'], selector: '.ui-loader' },
];
export const sourcePath = 'packages/design-system/tokens.json';
export const generatedFiles = ['tokens.css', 'studio/tokens.css'];
export const tokenId = (group, key) => `${group}/${key}`;
export const tokenValue = (tokens, id) => {
  const [group, key] = id.split('/');
  return group === 'shared' ? tokens.shared[key] : tokens.themes[group]?.[key];
};
export function locateToken(tokens, key, theme = 'light') {
  return tokenId(Object.hasOwn(tokens.shared, key) ? 'shared' : theme, key);
}
export function kindOf(key, value) {
  if (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return 'color';
  if (/^(?:var|color-mix)\(/.test(value)) return 'reference';
  if (/^font-/.test(key)) return 'font';
  if (/^weight-/.test(key)) return 'weight';
  if (/^leading-/.test(key)) return 'number';
  if (/^duration-/.test(key)) return 'duration';
  if (/^ease-/.test(key)) return 'easing';
  if (/^shadow-/.test(key)) return 'shadow';
  if (/^(?:overlay|glass|scrim)(?:-|$)/.test(key)) return 'effect';
  if (/^(?:radius|space|text|control|icon|topbar|panel-header)(?:-|$)/.test(key)) return 'length';
  return 'reference';
}
export function entries(tokens, theme = 'light') {
  return Object.entries({ ...tokens.themes[theme], ...tokens.shared }).map(([key, value]) => ({
    key, value, id: locateToken(tokens, key, theme), label: labels[key] || key,
    kind: kindOf(key, value), css: `--motion-${key}`,
  }));
}
export function references(tokens, key) {
  const needle = `var(--motion-${key})`;
  const result = [];
  for (const [name, value] of Object.entries(tokens.shared)) if (value.includes(needle)) result.push(`--motion-${name}`);
  for (const [name, value] of Object.entries(tokens.studio)) if (value.includes(needle)) result.push(`--${name}`);
  for (const component of components) if (component.fields.includes(key)) result.push(component.title);
  return [...new Set(result)];
}
function safeValue(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 600
    && !/[;{}<>\r\n@\\]|\/\*|\*\/|\b(?:url|expression)\s*\(/i.test(value);
}
function validColor(value) {
  if (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return true;
  const match = value.match(/^rgba?\(([^()]+)\)$/);
  if (!match) return false;
  const parts = match[1].trim().split(/[\s,/]+/);
  if (parts.length < 3 || parts.length > 4) return false;
  return parts.every((part, index) => /^\d*\.?\d+%?$/.test(part) && Number.parseFloat(part) <= (part.endsWith('%') ? 100 : index === 3 ? 1 : 255));
}
function validShadow(value) {
  if (value === 'none') return true;
  return value.split(/,(?![^()]*\))/).every(shadow => {
    const match = shadow.trim().match(/^(.+?)\s+(#[\da-f]{6}(?:[\da-f]{2})?|rgba?\([^()]+\))$/i);
    if (!match || !validColor(match[2])) return false;
    const parts = match[1].replace(/^inset\s+/, '').split(/\s+/);
    return parts.length >= 2 && parts.length <= 4 && parts.every(part => /^(?:0|-?\d+(?:\.\d+)?(?:px|rem|em))$/.test(part));
  });
}
export function validateValue(key, value, previous) {
  if (!safeValue(value)) return '请输入有效的样式值，不支持样式声明、URL 或脚本。';
  const type = kindOf(key, previous);
  if (type === 'color' && !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return '颜色使用 #RRGGBB 或 #RRGGBBAA。';
  if (type === 'length' && !/^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%))$/.test(value)) return '请输入非负尺寸，例如 8px、1rem。';
  if (type === 'length' && parseFloat(value) > 10000) return '尺寸不能超过 10000。';
  if (type === 'duration' && !/^\d+(?:\.\d+)?m?s$/.test(value)) return '请输入时间，例如 200ms 或 0.2s。';
  if (type === 'duration' && parseFloat(value) > (value.endsWith('ms') ? 10000 : 10)) return '时长不能超过 10 秒。';
  if (type === 'weight' && !/^(?:[1-9]\d{0,2}|1000)$/.test(value)) return '字重范围是 1–1000。';
  if (type === 'number' && (!/^\d+(?:\.\d+)?$/.test(value) || Number(value) > 5)) return '请输入 0–5 之间的数值。';
  if (type === 'font' && !/^[\p{L}\p{N}\s,'"._-]+$/u.test(value)) return '请输入字体名称，可用逗号添加回退字体。';
  if (type === 'easing' && !/^(?:linear|ease(?:-in|-out|-in-out)?|cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\))$/.test(value)) return '请输入有效的缓动名称或 cubic-bezier。';
  if (type === 'reference') return '此项为内部派生变量，请修改它引用的基础变量。';
  if (type === 'easing' && value.startsWith('cubic-bezier')) {
    const points = value.slice(13, -1).split(',').map(Number);
    if (points.length !== 4 || points.some(point => !Number.isFinite(point)) || points[0] < 0 || points[0] > 1 || points[2] < 0 || points[2] > 1) return '曲线的第一、第三个坐标必须在 0–1 之间。';
  }
  if (type === 'shadow' && !validShadow(value)) return '请输入完整的阴影值，例如 0 4px 12px rgb(0 0 0 / 10%)。';
  if (type === 'effect' && !(key.includes('backdrop') ? /^(?:blur\(\d+(?:\.\d+)?px\)|saturate\(\d+(?:\.\d+)?\))(?: (?:blur\(\d+(?:\.\d+)?px\)|saturate\(\d+(?:\.\d+)?\)))*$/.test(value) : validColor(value))) return '请输入有效的透明颜色或 blur / saturate 滤镜。';
  return null;
}
export function validateTokens(tokens) {
  for (const map of [tokens?.shared, tokens?.themes?.light, tokens?.themes?.dark, tokens?.studio]) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('设计变量结构不完整。');
    for (const [key, value] of Object.entries(map)) {
      if (!/^[a-z][a-z0-9-]*$/.test(key) || !safeValue(value)) throw new Error(`设计变量 ${key} 的格式无效。`);
    }
  }
  if (Object.keys(tokens.themes.light).sort().join() !== Object.keys(tokens.themes.dark).sort().join()) throw new Error('浅色和深色模式需要相同的变量。');
  for (const theme of ['light', 'dark']) {
    const values = { ...tokens.shared, ...tokens.themes[theme] };
    const visit = (key, trail = []) => {
      if (trail.includes(key)) throw new Error(`变量循环引用：${[...trail, key].join(' → ')}`);
      if (!Object.hasOwn(values, key)) throw new Error(`变量不存在：${key}`);
      for (const match of values[key].matchAll(/var\(--motion-([\w-]+)\)/g)) visit(match[1], [...trail, key]);
    };
    for (const key of Object.keys(values)) visit(key);
  }
  return tokens;
}
export function applyChanges(tokens, changes) {
  if (!Array.isArray(changes) || changes.length < 1 || changes.length > 200) throw new Error('一次保存需要 1–200 项修改。');
  const next = structuredClone(tokens), seen = new Set();
  for (const change of changes) {
    if (!change || typeof change.id !== 'string' || typeof change.value !== 'string') throw new Error('修改格式无效。');
    const [group, key, extra] = change.id.split('/');
    const map = group === 'shared' ? next.shared : ['light', 'dark'].includes(group) ? next.themes[group] : undefined;
    if (extra || !map || !Object.hasOwn(map, key) || seen.has(change.id)) throw new Error('只能修改现有的共享或主题变量。');
    const error = validateValue(key, change.value.trim(), map[key]);
    if (error) throw new Error(`${key}：${error}`);
    seen.add(change.id); map[key] = change.value.trim();
  }
  return validateTokens(next);
}
/** Rebase a browser draft without silently replacing concurrent source edits. */
export function mergeDraft(base, latest, changes) {
  const conflicts = [], remaining = [];
  for (const change of changes) {
    const before = tokenValue(base, change.id), now = tokenValue(latest, change.id);
    if (now === change.value) continue;
    if (now !== before) conflicts.push({ ...change, before, current: now });
    else remaining.push(change);
  }
  return { changes: remaining, conflicts };
}
