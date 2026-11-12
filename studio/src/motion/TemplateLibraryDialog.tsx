import { useEffect, useMemo, useRef, useState } from 'react';
import { isEditableTemplate, type GalleryTemplate, type TemplatePage } from '../../../shared/catalog';
import { templatePrompt, type IntegrationInfo } from '../../../shared/integration';
import { useI18n } from '../i18n/I18n';
import { motionApi } from './useWorkspace';
import { MotionIcon } from './icons';
import * as tracking from './templateLibraryTracking';
import type { FilterGroup, Placement, Sort } from './templateLibraryTracking';
import styles from './TemplateLibraryDialog.module.css';
import figmaLogo from './template-brands/figma.png';
import lovableLogo from './template-brands/lovable.svg';
import linearLogo from './template-brands/linear.svg';
import firecrawlLogo from './template-brands/firecrawl.png';
import kimiLogo from './template-brands/kimi.png';
import pondLogo from './template-brands/pond.svg';
const brandLogos: Record<string, string> = {Figma: figmaLogo, Lovable: lovableLogo, Linear: linearLogo, Firecrawl: firecrawlLogo, Kimi: kimiLogo, Pond: pondLogo};

type Props = { returnFocus?: HTMLElement | null; open: boolean; busy: boolean; error: string; onClose: () => void; onOpen: (id: string) => void; projectId?: string };
type Facet = FilterGroup;
const facets: [Facet, string][] = [
  ['brand', 'Reference brands'], ['uses', 'Use cases'], ['styles', 'Video types'],
  ['industries', 'Industries'], ['creationModels', 'Creation models'], ['colors', 'Colors'],
  ['ratio', 'Aspect ratio'], ['duration', 'Duration'],
];
function values(template: GalleryTemplate, key: Facet): string[] {
  if (key === 'brand') return template.brand ? [template.brand] : [];
  if (key === 'ratio') {
    if (!template.width || !template.height) return [];
    if (template.width === template.height) return ['Square'];
    return [template.width > template.height ? 'Landscape' : 'Portrait'];
  }
  if (key === 'duration') {
    const duration = template.duration;
    if (!duration) return [];
    if (duration < 10) return ['Under 10 seconds'];
    if (duration < 15) return ['10–15 seconds'];
    if (duration < 30) return ['15–30 seconds'];
    if (duration < 60) return ['30–60 seconds'];
    return ['60 seconds or longer'];
  }
  return template[key] ?? [];
}

/** `exposureKey` names the result set the card is shown in; `onSeen` returns false when the card is covered and should be retried. */
function TemplateCard({ template, onSelect, exposureKey, onSeen }: { template: GalleryTemplate; onSelect: () => void; exposureKey: string; onSeen: () => boolean }) {
  const { t } = useI18n();
  const card = useRef<HTMLElement>(null), seen = useRef(onSeen); seen.current = onSeen;
  // Seen means at least half the card stayed on screen for one second; it is reported once per result set.
  useEffect(() => {
    const element = card.current;
    if (!element) return;
    let timer: ReturnType<typeof setTimeout> | undefined, done = false;
    const arm = () => { timer = setTimeout(() => { timer = undefined; if (seen.current()) { done = true; observer.disconnect(); } else arm(); }, 1000); };
    const observer = new IntersectionObserver(([entry]) => {
      if (done) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { if (timer === undefined) arm(); }
      else { clearTimeout(timer); timer = undefined; }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [exposureKey]);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const stop = () => { video.current?.pause(); setPlaying(false); };
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); });
    observer.observe(element);
    return () => { observer.disconnect(); element.pause(); };
  }, []);
  const play = () => {
    if (!video.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!video.current.src) video.current.src = template.previewUrl!;
    void video.current.play().then(() => setPlaying(true)).catch(() => {});
  };
  return <article ref={card} className={styles.card} data-template-id={template.id}>
    <button className={styles.cover} onClick={onSelect} onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} aria-label={t('Preview template {title}', { title: template.title })}>
      {template.posterUrl ? <img src={template.posterUrl} alt="" loading="lazy" /> : <span>{template.title}</span>}
      {template.previewUrl && <video ref={video} muted playsInline loop preload="none" aria-hidden="true" style={{ opacity: playing ? 1 : 0 }} />}
      <span className={styles.play}><MotionIcon name="play" size={18} /></span>
    </button>
    <button className={styles.title} onClick={onSelect}>{template.title}</button>
    <p>{template.brand || template.authorName || template.author}{template.duration ? ` · ${t('{value}s', { value: Number(template.duration.toFixed(1)) })}` : ''}</p>
  </article>;
}

/** The website's catalog region, backed by the editor's existing Prism cache and project actions. */
export function TemplateLibraryDialog(props: Props) {
  const { t, locale } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null), detail = useRef<HTMLDialogElement>(null), filter = useRef<HTMLDialogElement>(null);
  const useDialog = useRef<HTMLDialogElement>(null);
  const [downloading, setDownloading] = useState(false), [downloadError, setDownloadError] = useState('');
  const [catalog, setCatalog] = useState<GalleryTemplate[]>([]);
  const [warning, setWarning] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [attempt, retry] = useState(0), [query, setQuery] = useState(''), [sort, setSort] = useState<Sort>('recommended');
  const [selected, setSelected] = useState<Partial<Record<Facet, string[]>>>({});
  const [moreBrands, setMoreBrands] = useState(false), [searchOpen, setSearchOpen] = useState(false);
  const [preview, setPreview] = useState<GalleryTemplate | null>(null), [prompt, setPrompt] = useState(''), [feedback, setFeedback] = useState('');
  const info = useRef<IntegrationInfo | null>(null);
  // Tracking state. Ids tie one detail view, one copy and one search to the events that follow from them.
  const detailViewId = useRef<string | undefined>(undefined), searchId = useRef<string | undefined>(undefined), reportedQuery = useRef(''), shown = useRef(false);
  const pendingResult = useRef<'category_select' | 'filter_apply' | 'filter_clear' | 'sort_change' | undefined>(undefined), composing = useRef(false);
  const [settle, setSettle] = useState(0);
  useEffect(() => {
    if (!props.open) return;
    const openedDialog = dialog.current;
    const trigger = props.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    openedDialog?.showModal();
    return () => {
      useDialog.current?.close(); detail.current?.close(); filter.current?.close(); openedDialog?.close(); setPreview(null);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [props.open, props.returnFocus]);
  useEffect(() => {
    if (!props.open) return;
    setCatalog([]); setSelected({}); setQuery(''); setPreview(null); detail.current?.close(); useDialog.current?.close();
    shown.current = false; searchId.current = undefined; reportedQuery.current = ''; pendingResult.current = undefined; shownCards.current.clear();
    const controller = new AbortController();
    let version: string | undefined, pending = false;
    async function load() {
      pending = true; setLoading(true); setError('');
      try {
        const items: GalleryTemplate[] = []; let offset: number | null = 0;
        while (offset !== null) {
          const page: TemplatePage = await motionApi(`/template-catalog?category=all&covered=true&limit=60&offset=${offset}&locale=${encodeURIComponent(locale)}`, { signal: controller.signal });
          items.push(...page.items); offset = page.next; version = page.catalogVersion; setWarning(page.warning ?? '');
        }
        if (!controller.signal.aborted) { setCatalog(items); if (!shown.current) { shown.current = true; tracking.reportLibraryShown(items.length, props.projectId); } }
      } catch (err) { if (!controller.signal.aborted) setError((err as Error).message); }
      finally { pending = false; if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    const timer = setInterval(async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const page = await motionApi<TemplatePage>(`/template-catalog?limit=1&locale=${encodeURIComponent(locale)}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setWarning(page.warning ?? '');
        if (page.catalogVersion !== version) await load();
      } catch {} finally { pending = false; }
    }, 5000);
    void motionApi<IntegrationInfo>('/integration', { signal: controller.signal }).then(value => { info.current = value; }).catch(() => {});
    return () => { controller.abort(); clearInterval(timer); };
  }, [props.open, attempt, locale]);
  const available = useMemo(() => facets.map(([key, label]) => ({ key, label, values: [...new Set(catalog.flatMap(item => values(item, key)))] })).filter(facet => facet.values.length), [catalog]);
  const hasFilters = Boolean(query || Object.values(selected).some(items => items?.length));
  const visible = useMemo(() => catalog.filter(item => {
    const text = [item.id, item.title, item.description, item.author, ...item.tags, ...facets.flatMap(([key]) => values(item, key))].join(' ').toLocaleLowerCase();
    return text.includes(query.trim().toLocaleLowerCase()) && facets.every(([key]) => !selected[key]?.length || selected[key]!.some(value => values(item, key).includes(value)));
  }).sort((a, b) => sort === 'recommended' ? (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) : a.title.localeCompare(b.title, locale) * (sort === 'reverse' ? -1 : 1)), [catalog, query, selected, sort, locale]);
  const featured = catalog.filter(item => item.featuredOrder != null).sort((a, b) => a.featuredOrder! - b.featuredOrder!);
  const filterCount = Object.values(selected).flat().length;
  // A search id belongs to exactly one keyword: once the box holds something else, events stop carrying it.
  const listContext = () => ({ searchId: query.trim() && query.trim() === reportedQuery.current ? searchId.current : undefined, sort, filterCount });
  // The list state is read when a timer or effect fires, not when it was scheduled.
  const latest = useRef({ count: 0, context: listContext() }); latest.current = { count: visible.length, context: listContext() };
  const reset = () => {
    if (hasFilters) { tracking.reportDiscoveryClick('filter_clear', listContext(), {}, props.projectId); pendingResult.current = 'filter_clear'; }
    setQuery(''); setSelected({});
  };
  // `control` is where the option was picked: the sidebar reports a category choice, the filter dialog and chips a filter option.
  const toggle = (key: Facet, value: string, control: 'category_select' | 'filter_option') => {
    settleSearch();
    tracking.reportDiscoveryClick(control, listContext(), { filter_group: key, option: value, selected: !selected[key]?.includes(value) }, props.projectId);
    pendingResult.current = control === 'category_select' ? 'category_select' : 'filter_apply';
    setSelected(previous => ({ ...previous, [key]: previous[key]?.includes(value) ? previous[key]!.filter(item => item !== value) : [...(previous[key] ?? []), value] }));
  };
  const changeSort = (next: Sort) => {
    settleSearch();
    tracking.reportDiscoveryClick('sort_option', { ...listContext(), sort: next }, { previous_sort: sort, changed: next !== sort }, props.projectId);
    if (next !== sort) pendingResult.current = 'sort_change';
    setSort(next);
  };
  // A filter, category or sort result is reported after the changed list has rendered, with the count the user now sees.
  useEffect(() => {
    const action = pendingResult.current; pendingResult.current = undefined;
    if (action) tracking.reportFilterResult(action, latest.current.count, latest.current.context, props.projectId);
  }, [selected, sort, query]);
  // One search report per settled query: 500 ms after typing stops, or right before the user acts on the results,
  // and never mid-composition or before the catalogue has loaded. Each new keyword gets a new search id.
  const settleSearch = () => {
    const keyword = query.trim();
    if (!keyword || keyword === reportedQuery.current || composing.current || loading || !shown.current) return;
    const id = tracking.newTrackingId(); reportedQuery.current = keyword; searchId.current = id;
    tracking.reportSearchResult(id, query, visible.length, { sort, filterCount }, props.projectId);
  };
  const settleLatest = useRef(settleSearch); settleLatest.current = settleSearch;
  useEffect(() => {
    if (!query.trim()) { reportedQuery.current = ''; searchId.current = undefined; return; }
    const timer = setTimeout(() => settleLatest.current(), 500);
    return () => clearTimeout(timer);
  }, [query, settle, loading, catalog.length]);
  async function showPrompt() {
    if (!preview) return;
    tracking.reportUseClicked(preview, 'recreate', detailViewId.current, props.projectId);
    setFeedback('');
    useDialog.current?.showModal();
    tracking.reportInstructionShown(preview, detailViewId.current, props.projectId);
    try {
      const connection = info.current ?? await motionApi<IntegrationInfo>('/integration'); info.current = connection;
      setPrompt(templatePrompt(connection, 'codex', preview, locale));
    } catch (err) { setFeedback((err as Error).message); }
  }
  async function copy() {
    const template = preview, view = detailViewId.current, attemptId = tracking.newTrackingId();
    if (template) tracking.reportCopyClicked(template, attemptId, view, props.projectId);
    let status: 'clipboard_written' | 'manual_fallback_shown' = 'clipboard_written';
    try { await navigator.clipboard.writeText(prompt); setFeedback(t('Copied')); }
    catch { status = 'manual_fallback_shown'; setFeedback(t('Copy the instruction below and send it to your Agent.')); }
    // The instruction this dialog builds is always the Codex one.
    if (template) tracking.reportCopyResult(template, status, attemptId, view, props.projectId);
  }
  async function downloadMotion() {
    if (!preview?.motionDocumentUrl) return;
    const template = preview, view = detailViewId.current, attemptId = tracking.newTrackingId();
    tracking.reportDownloadClicked(template, 'download_guide', attemptId, view, props.projectId);
    setDownloading(true); setDownloadError('');
    let errorCode = 'FETCH_ERROR';
    try {
      const response = await fetch(preview.motionDocumentUrl, { credentials: 'omit' });
      if (!response.ok) { errorCode = `HTTP_${response.status}`; throw new Error(`Download HTTP ${response.status}`); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'motion.md'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      tracking.reportDownloadResult(template, attemptId, 'browser_save_requested', undefined, view, props.projectId);
    } catch { setDownloadError(t('Download failed. Please try again.')); tracking.reportDownloadResult(template, attemptId, 'fetch_failed', errorCode, view, props.projectId); }
    finally { setDownloading(false); }
  }
  const show = (item: GalleryTemplate, placement: Placement, position: number) => {
    settleSearch();
    tracking.reportCardOpened(item, placement, position, listContext(), props.projectId);
    setPreview(item); setPrompt(''); setFeedback(''); setDownloadError(''); detail.current?.showModal();
    const view = tracking.newTrackingId(); detailViewId.current = view;
    tracking.reportDetailShown(item, view, props.projectId);
  };
  // One result set per search, filter and sort combination: a card is reported again only when that combination changes.
  const resultSet = JSON.stringify([query.trim(), sort, selected]);
  const shownCards = useRef(new Set<string>());
  const cardSeen = (item: GalleryTemplate, placement: Placement, position: number) => {
    if (document.hidden || detail.current?.open || filter.current?.open || useDialog.current?.open) return false;
    const key = `${resultSet}|${placement}|${item.id}`;
    if (shownCards.current.has(key)) return true;
    shownCards.current.add(key);
    settleSearch();
    tracking.reportCardShown(item, placement, position, listContext(), props.projectId);
    return true;
  };
  const cards = (items: GalleryTemplate[], placement: Placement) => <div className={styles.grid}>{items.map((item, index) => <TemplateCard key={item.id} template={item} exposureKey={resultSet}
    onSelect={() => show(item, placement, index + 1)} onSeen={() => cardSeen(item, placement, index + 1)} />)}</div>;
  return <dialog ref={dialog} className={styles.library} aria-label={t('Template library')} onKeyDown={event => event.stopPropagation()} onCancel={event => { if (event.target !== dialog.current) return; event.preventDefault(); if (!props.busy) props.onClose(); }}>
    <header className={styles.header}><h1>{t('Template library')}</h1><button disabled={props.busy} onClick={props.onClose} aria-label={t('Close template library')}><MotionIcon name="close" size={24} /></button></header>
    {(props.error || error) && <div className={styles.status} role="alert">{t(props.error || error)}{error && <button onClick={() => retry(value => value + 1)}>{t('Retry')}</button>}</div>}
    {warning && <p className={styles.status} role="status">{t(warning)}</p>}
    {props.busy && <p className={styles.status} role="status">{t('Preparing editable project…')}</p>}
    <div className={styles.browser}>
      <aside className={styles.sidebar} aria-label={t('Filters')}>
        <button className={styles.all} aria-current={!hasFilters ? 'page' : undefined} onClick={reset}>{t('All templates')}<span>{catalog.length}</span></button>
        {available.filter(facet => ['brand', 'uses', 'styles', 'industries', 'creationModels'].includes(facet.key)).map(facet => <details key={facet.key} open={facet.key === 'brand'}><summary>{t(facet.label)}</summary>
          {facet.values.slice(0, facet.key === 'brand' && !moreBrands ? 5 : undefined).map(value => <button key={value} aria-pressed={selected[facet.key]?.includes(value) ?? false} onClick={() => toggle(facet.key, value, 'category_select')}>
            {facet.key === 'brand' && <span className={styles.brandIcon} aria-hidden="true">{brandLogos[value] ? <img src={brandLogos[value]} alt="" /> : value.slice(0, 1)}</span>}<span>{value}</span><small>{catalog.filter(item => values(item, facet.key).includes(value)).length}</small>
          </button>)}
          {facet.key === 'brand' && facet.values.length > 5 && <button onClick={() => { tracking.reportDiscoveryClick('category_more', listContext(), { filter_group: 'brand', expanded: !moreBrands }, props.projectId); setMoreBrands(!moreBrands); }}>{t(moreBrands ? 'Show less' : 'Show more')}</button>}
        </details>)}
      </aside>
      <main className={styles.results} aria-busy={loading}>
        {!hasFilters && featured.length > 0 && <section className={styles.featured}><h2>{t('Popular templates')}</h2>{cards(featured, 'popular')}</section>}
        <div className={styles.toolbar}><h2>{t('All templates')} <small>{t('{count} templates', { count: visible.length })}</small></h2><div className={styles.controls}>
          <button aria-label={t('Search templates')} aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><MotionIcon name="search" size={21} /></button>
          <button onClick={() => { tracking.reportDiscoveryClick('filter_open', listContext(), {}, props.projectId); filter.current?.showModal(); }}><MotionIcon name="sliders" />{t('Filters')}{Object.values(selected).flat().length > 0 && ` (${Object.values(selected).flat().length})`}</button>
          <select aria-label={t('Sort')} value={sort} onChange={event => changeSort(event.target.value as Sort)}><option value="recommended">{t('Recommended order')}</option><option value="name">{t('Name A–Z')}</option><option value="reverse">{t('Name Z–A')}</option></select>
        </div></div>
        {searchOpen && <input className={styles.search} autoFocus type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; setSettle(value => value + 1); }} placeholder={t('Search templates, creators, styles…')} aria-label={t('Search templates')} />}
        {hasFilters && <div className={styles.chips}>{facets.flatMap(([key]) => (selected[key] ?? []).map(value => <button key={key + value} onClick={() => toggle(key, value, 'filter_option')}>{t(value)} ×</button>))}<button onClick={reset}>{t('Clear filters')}</button></div>}
        {loading && !catalog.length ? <p role="status">{t('Loading templates…')}</p> : cards(visible, 'catalog')}
        {!loading && !visible.length && !error && <p className={styles.empty}>{t('No matching templates. Try another name, creator or style.')}</p>}
      </main>
    </div>
    <dialog ref={filter} className={styles.filters} aria-label={t('Filters')}><header><h2>{t('Filters')}</h2><button onClick={() => filter.current?.close()} aria-label={t('Close')}><MotionIcon name="close" /></button></header>
      {available.map(facet => <fieldset key={facet.key}><legend>{t(facet.label)}</legend>{facet.values.map(value => <label key={value}><input type="checkbox" checked={selected[facet.key]?.includes(value) ?? false} onChange={() => toggle(facet.key, value, 'filter_option')} />{t(value)}</label>)}</fieldset>)}
      <footer><button onClick={reset}>{t('Clear filters')}</button><button onClick={() => { tracking.reportDiscoveryClick('filter_apply', listContext(), {}, props.projectId); filter.current?.close(); }}>{t('Done')}</button></footer>
    </dialog>
    <dialog ref={detail} className={styles.detail} aria-label={t('Template preview')} onClose={() => { setPreview(null); setPrompt(''); detailViewId.current = undefined; }}>
      {preview && <><button className={styles.close} onClick={() => detail.current?.close()} aria-label={t('Close template preview')}><MotionIcon name="close" size={24} /></button><div className={styles.detailGrid}>
        <div className={styles.stage}>{preview.previewUrl ? <video key={preview.id} src={preview.previewUrl} poster={preview.posterUrl} controls playsInline /> : preview.posterUrl ? <img src={preview.posterUrl} alt={preview.title} /> : <p>{preview.title}</p>}</div>
        <div className={styles.detailInfo}><small>{preview.styles?.join(' · ') || preview.subtitle}</small><h2>{preview.title}</h2><p>{preview.description}</p>
          {preview.sourceUrl ? <a href={preview.sourceUrl} target="_blank" rel="noreferrer">{preview.authorName || preview.author} ↗</a> : <p>{preview.authorName || preview.author}</p>}
          <div className={styles.actions}><button disabled={!preview.motionDocumentUrl || downloading} onClick={() => void downloadMotion()}>{t(downloading ? 'Downloading…' : 'Download motion.md')}</button><button onClick={() => void showPrompt()}>{t('Recreate template')}</button></div>
          <div className={styles.projectActions}>{isEditableTemplate(preview) && <button disabled={props.busy} onClick={() => { tracking.reportUseClicked(preview, 'open_edit', detailViewId.current, props.projectId); detail.current?.close(); props.onOpen(preview.id); }}>{t('Open and edit')} ↗</button>}{preview.projectFileUrl && <a href={preview.projectFileUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportDownloadClicked(preview, 'download_project', undefined, detailViewId.current, props.projectId)}>{t('Download OpenMotion project')} ↗</a>}</div>
          {downloadError && <p role="status">{downloadError}</p>}
          <dl><dt>{t('Video types')}</dt><dd>{preview.styles?.join(' · ') || '—'}</dd><dt>{t('Creation models')}</dt><dd>{preview.creationModels?.join(' · ') || '—'}</dd><dt>{t('Duration')}</dt><dd>{preview.duration ? t('{value}s', { value: preview.duration }) : '—'}</dd></dl>
        </div></div>
        {(preview.styleDescription || preview.reviewFocus || preview.motionGuideUrl) && <section className={styles.guide} aria-label={t('Motion guide')}>
          <aside><h3>{t('On this page')}</h3>{preview.styleDescription && <a href="#template-style">{t('Visual style')}</a>}{preview.reviewFocus && <a href="#template-notes">{t('Production notes')}</a>}{preview.motionGuideUrl && <a href="#template-guide">{t('Motion guide')}</a>}</aside>
          <div>{preview.styleDescription && <section id="template-style"><h3>{t('Visual style')}</h3><p>{preview.styleDescription}</p></section>}{preview.reviewFocus && <section id="template-notes"><h3>{t('Production notes')}</h3><p>{preview.reviewFocus}</p></section>}{preview.motionGuideUrl && <section id="template-guide"><h3>{t('Motion guide')}</h3><iframe src={preview.motionGuideUrl} title={t('Motion guide')} sandbox="allow-scripts" loading="lazy" referrerPolicy="no-referrer" /><a href={preview.motionGuideUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportFullPageClicked(preview, detailViewId.current, props.projectId)}>{t('View full page')} ↗</a></section>}</div>
        </section>}</>}
    </dialog>
    <dialog ref={useDialog} className={styles.useDialog} aria-label={t('Recreate template')}>
      <header><h2>{t('Recreate template')}</h2><button onClick={() => useDialog.current?.close()} aria-label={t('Close')}><MotionIcon name="close" size={24} /></button></header>
      {preview && <div className={styles.handoff}>{preview.posterUrl && <img src={preview.posterUrl} alt="" />}<div><strong>{preview.title}</strong><p>{preview.id}</p></div></div>}
      <p className={styles.promptLabel}>{t('Copy the instruction below and send it to your Agent.')}</p>
      <div className={styles.promptRow}><textarea className={styles.prompt} rows={8} readOnly value={prompt} aria-label={t('Content to copy')} />
      <button className={styles.copyPrompt} disabled={!prompt} onClick={() => void copy()} aria-label={t('Copy')}><MotionIcon name="copy" size={22} /></button></div><p className={styles.copyStatus} role="status">{feedback}</p>
    </dialog>
  </dialog>;
}
