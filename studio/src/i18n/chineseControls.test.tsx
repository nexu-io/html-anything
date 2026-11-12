// @vitest-environment happy-dom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from './I18n';
import { translate } from './messages';
import { EasePresetGrid, EaseModeToggle } from '../components/editor/EaseModeControls';
import { EaseCurveSection } from '../components/editor/EaseCurveSection';
import { EASE_PRESETS } from '../components/editor/easePresetLibrary';
import { FlatSelectRow } from '../components/editor/propertyPanelFlatSelectRow';
import { PropertyRow } from '../components/editor/AnimationCardParts';

let root: Root;
afterEach(() => { act(() => root?.unmount()); document.body.replaceChildren(); localStorage.clear(); });
function SwitchLanguage() {
  const { setLocale } = useI18n();
  return <button onClick={() => setLocale('en')}>English</button>;
}
function render(children: ReactNode) {
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  act(() => root.render(<I18nProvider initialLocale="zh-CN">{children}<SwitchLanguage /></I18nProvider>));
  return host;
}

it('localizes easing choices and live language switches without changing ease values', () => {
  const pick = vi.fn();
  const host = render(<><EaseModeToggle mode="curve" onCommit={pick} /><EasePresetGrid kind="curve" currentEase="none" onSelect={pick} /><EasePresetGrid kind="spring" currentEase="spring(0.15)" onSelect={pick} /><EasePresetGrid kind="wiggle" currentEase="" onSelect={pick} /></>);
  for (const preset of EASE_PRESETS) {
    const button = host.querySelector<HTMLButtonElement>(`[data-ease-preset-id="${preset.id}"]`)!;
    expect(button.title).toBe(translate('zh-CN', preset.label));
    expect(button.textContent).toBe(button.title);
    expect(button.title).toMatch(/[\u4e00-\u9fff]/);
  }
  expect(host.querySelector('[data-ease-mode="curve"]')?.textContent).toBe('曲线');
  act(() => host.querySelector<HTMLButtonElement>('[data-ease-preset-id="quad-out"]')!.click());
  expect(pick).toHaveBeenLastCalledWith('power2.out');
  act(() => [...host.querySelectorAll('button')].find(b => b.textContent === 'English')!.click());
  expect(host.querySelector('[data-ease-preset-id="quad-out"]')?.textContent).toBe('Quad Out');
});

it('localizes the selected ease label as well as the dropdown', () => {
  const host = render(<EaseCurveSection ease="power2.out" onCustomEaseCommit={vi.fn()} />);
  expect(host.querySelector('[data-ease-type-dropdown]')?.textContent).toBe('二次缓出');
  expect(host.textContent).not.toContain('Curve');
});

it('translates offered CSS options while keeping their values and authored values intact', () => {
  const pick = vi.fn();
  const host = render(<FlatSelectRow label="Blend" value="Warm" options={['multiply', 'screen', 'overlay']} tier="explicitCustom" onChange={pick} />);
  const options = [...host.querySelectorAll('option')];
  expect(options.map(o => [o.value, o.textContent])).toEqual([['Warm', 'Warm'], ['multiply', '正片叠底'], ['screen', '滤色'], ['overlay', '叠加']]);
  const select = host.querySelector('select')!;
  act(() => { select.value = 'multiply'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(pick).toHaveBeenCalledWith('multiply');
});

it('translates animation filter controls while preserving the authored filter string', () => {
  const pick = vi.fn();
  const host = render(<PropertyRow prop="filter" val="My Custom Filter" onCommit={pick} onRemove={vi.fn()} removeTitle="Remove" />);
  expect(host.querySelector('input')?.value).toBe('My Custom Filter');
  const bright = [...host.querySelectorAll('button')].find(b => b.textContent?.trim() === '增亮')!;
  expect(bright).toBeTruthy();
  act(() => bright.click());
  expect(pick).toHaveBeenCalledWith('brightness(1.5)');
});
