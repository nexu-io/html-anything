import { useEffect, useMemo, useRef, useState } from 'react';
import { isEditableTemplate, type GalleryTemplate, type TemplatePage } from '../../../shared/catalog';
import { templatePrompt, type IntegrationInfo } from '../../../shared/integration';
import { useI18n } from '../i18n/I18n';
import { motionApi } from './useWorkspace';
import { MotionIcon } from './icons';
import styles from './TemplateLibraryDialog.module.css';
import figmaLogo from './template-brands/figma.png';
import lovableLogo from './template-brands/lovable.svg';
import linearLogo from './template-brands/linear.svg';
import firecrawlLogo from './template-brands/firecrawl.png';
import kimiLogo from './template-brands/kimi.png';
import pondLogo from './template-brands/pond.svg';
const brandLogos: Record<string, string> = {Figma: figmaLogo, Lovable: lovableLogo, Linear: linearLogo, Firecrawl: firecrawlLogo, Kimi: kimiLogo, Pond: pondLogo};

type Props = { returnFocus?: HTMLElement | null; open: boolean; busy: boolean; openingDisabled?: boolean; error: string; onClose: () => void; onOpen: (id: string) => void };
type Facet = 'brand' | 'uses' | 'styles' | 'industries' | 'creationModels' | 'colors' | 'ratio' | 'duration';
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

function TemplateCard({ template, onSelect }: { template: GalleryTemplate; onSelect: () => void }) {
  const { t } = useI18n();
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
  return <article className={styles.card} data-template-id={template.id}>
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
  const [attempt, retry] = useState(0), [query, setQuery] = useState(''), [sort, setSort] = useState('recommended');
  const [selected, setSelected] = useState<Partial<Record<Facet, string[]>>>({});
  const [moreBrands, setMoreBrands] = useState(false), [searchOpen, setSearchOpen] = useState(false);
  const [preview, setPreview] = useState<GalleryTemplate | null>(null), [prompt, setPrompt] = useState(''), [feedback, setFeedback] = useState('');
  const info = useRef<IntegrationInfo | null>(null);
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
        if (!controller.signal.aborted) setCatalog(items);
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
  const reset = () => { setQuery(''); setSelected({}); };
  const toggle = (key: Facet, value: string) => setSelected(previous => ({ ...previous, [key]: previous[key]?.includes(value) ? previous[key]!.filter(item => item !== value) : [...(previous[key] ?? []), value] }));
  async function showPrompt() {
    if (!preview) return;
    setFeedback('');
    useDialog.current?.showModal();
    try {
      const connection = info.current ?? await motionApi<IntegrationInfo>('/integration'); info.current = connection;
      setPrompt(templatePrompt(connection, 'codex', preview, locale));
    } catch (err) { setFeedback((err as Error).message); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setFeedback(t('Copied')); }
    catch { setFeedback(t('Copy the instruction below and send it to your Agent.')); }
  }
  async function downloadMotion() {
    if (!preview?.motionDocumentUrl) return;
    setDownloading(true); setDownloadError('');
    try {
      const response = await fetch(preview.motionDocumentUrl, { credentials: 'omit' });
      if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'motion.md'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setDownloadError(t('Download failed. Please try again.')); }
    finally { setDownloading(false); }
  }
  const show = (item: GalleryTemplate) => { setPreview(item); setPrompt(''); setFeedback(''); setDownloadError(''); detail.current?.showModal(); };
  const cards = (items: GalleryTemplate[]) => <div className={styles.grid}>{items.map(item => <TemplateCard key={item.id} template={item} onSelect={() => show(item)} />)}</div>;
  return <dialog ref={dialog} className={styles.library} aria-label={t('Template library')} onKeyDown={event => event.stopPropagation()} onCancel={event => { if (event.target !== dialog.current) return; event.preventDefault(); if (!props.busy) props.onClose(); }}>
    <header className={styles.header}><h1>{t('Template library')}</h1><button disabled={props.busy} onClick={props.onClose} aria-label={t('Close template library')}><MotionIcon name="close" size={24} /></button></header>
    {(props.error || error) && <div className={styles.status} role="alert">{t(props.error || error)}{error && <button onClick={() => retry(value => value + 1)}>{t('Retry')}</button>}</div>}
    {warning && <p className={styles.status} role="status">{t(warning)}</p>}
    {props.busy && <p className={styles.status} role="status">{t('Preparing editable project…')}</p>}
    <div className={styles.browser}>
      <aside className={styles.sidebar} aria-label={t('Filters')}>
        <button className={styles.all} aria-current={!hasFilters ? 'page' : undefined} onClick={reset}>{t('All templates')}<span>{catalog.length}</span></button>
        {available.filter(facet => ['brand', 'uses', 'styles', 'industries', 'creationModels'].includes(facet.key)).map(facet => <details key={facet.key} open={facet.key === 'brand'}><summary>{t(facet.label)}</summary>
          {facet.values.slice(0, facet.key === 'brand' && !moreBrands ? 5 : undefined).map(value => <button key={value} aria-pressed={selected[facet.key]?.includes(value) ?? false} onClick={() => toggle(facet.key, value)}>
            {facet.key === 'brand' && <span className={styles.brandIcon} aria-hidden="true">{brandLogos[value] ? <img src={brandLogos[value]} alt="" /> : value.slice(0, 1)}</span>}<span>{value}</span><small>{catalog.filter(item => values(item, facet.key).includes(value)).length}</small>
          </button>)}
          {facet.key === 'brand' && facet.values.length > 5 && <button onClick={() => setMoreBrands(!moreBrands)}>{t(moreBrands ? 'Show less' : 'Show more')}</button>}
        </details>)}
      </aside>
      <main className={styles.results} aria-busy={loading}>
        {!hasFilters && featured.length > 0 && <section className={styles.featured}><h2>{t('Popular templates')}</h2>{cards(featured)}</section>}
        <div className={styles.toolbar}><h2>{t('All templates')} <small>{t('{count} templates', { count: visible.length })}</small></h2><div className={styles.controls}>
          <button aria-label={t('Search templates')} aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><MotionIcon name="search" size={21} /></button>
          <button onClick={() => filter.current?.showModal()}><MotionIcon name="sliders" />{t('Filters')}{Object.values(selected).flat().length > 0 && ` (${Object.values(selected).flat().length})`}</button>
          <select aria-label={t('Sort')} value={sort} onChange={event => setSort(event.target.value)}><option value="recommended">{t('Recommended order')}</option><option value="name">{t('Name A–Z')}</option><option value="reverse">{t('Name Z–A')}</option></select>
        </div></div>
        {searchOpen && <input className={styles.search} autoFocus type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search templates, creators, styles…')} aria-label={t('Search templates')} />}
        {hasFilters && <div className={styles.chips}>{facets.flatMap(([key]) => (selected[key] ?? []).map(value => <button key={key + value} onClick={() => toggle(key, value)}>{t(value)} ×</button>))}<button onClick={reset}>{t('Clear filters')}</button></div>}
        {loading && !catalog.length ? <p role="status">{t('Loading templates…')}</p> : cards(visible)}
        {!loading && !visible.length && !error && <p className={styles.empty}>{t('No matching templates. Try another name, creator or style.')}</p>}
      </main>
    </div>
    <dialog ref={filter} className={styles.filters} aria-label={t('Filters')}><header><h2>{t('Filters')}</h2><button onClick={() => filter.current?.close()} aria-label={t('Close')}><MotionIcon name="close" /></button></header>
      {available.map(facet => <fieldset key={facet.key}><legend>{t(facet.label)}</legend>{facet.values.map(value => <label key={value}><input type="checkbox" checked={selected[facet.key]?.includes(value) ?? false} onChange={() => toggle(facet.key, value)} />{t(value)}</label>)}</fieldset>)}
      <footer><button onClick={reset}>{t('Clear filters')}</button><button onClick={() => filter.current?.close()}>{t('Done')}</button></footer>
    </dialog>
    <dialog ref={detail} className={styles.detail} aria-label={t('Template preview')} onClose={() => { setPreview(null); setPrompt(''); }}>
      {preview && <><button className={styles.close} onClick={() => detail.current?.close()} aria-label={t('Close template preview')}><MotionIcon name="close" size={24} /></button><div className={styles.detailGrid}>
        <div className={styles.stage}>{preview.previewUrl ? <video key={preview.id} src={preview.previewUrl} poster={preview.posterUrl} controls playsInline /> : preview.posterUrl ? <img src={preview.posterUrl} alt={preview.title} /> : <p>{preview.title}</p>}</div>
        <div className={styles.detailInfo}><small>{preview.styles?.join(' · ') || preview.subtitle}</small><h2>{preview.title}</h2><p>{preview.description}</p>
          {preview.sourceUrl ? <a href={preview.sourceUrl} target="_blank" rel="noreferrer">{preview.authorName || preview.author} ↗</a> : <p>{preview.authorName || preview.author}</p>}
          <div className={styles.actions}><button disabled={!preview.motionDocumentUrl || downloading} onClick={() => void downloadMotion()}>{t(downloading ? 'Downloading…' : 'Download motion.md')}</button><button onClick={() => void showPrompt()}>{t('Recreate template')}</button></div>
          <div className={styles.projectActions}>{isEditableTemplate(preview) && <button disabled={props.busy || props.openingDisabled} onClick={() => { detail.current?.close(); props.onOpen(preview.id); }}>{t('Open and edit')} ↗</button>}{preview.projectFileUrl && <a href={preview.projectFileUrl} target="_blank" rel="noreferrer">{t('Download OpenMotion project')} ↗</a>}</div>
          {downloadError && <p role="status">{downloadError}</p>}
          <dl><dt>{t('Video types')}</dt><dd>{preview.styles?.join(' · ') || '—'}</dd><dt>{t('Creation models')}</dt><dd>{preview.creationModels?.join(' · ') || '—'}</dd><dt>{t('Duration')}</dt><dd>{preview.duration ? t('{value}s', { value: preview.duration }) : '—'}</dd></dl>
        </div></div>
        {(preview.styleDescription || preview.reviewFocus || preview.motionGuideUrl) && <section className={styles.guide} aria-label={t('Motion guide')}>
          <aside><h3>{t('On this page')}</h3>{preview.styleDescription && <a href="#template-style">{t('Visual style')}</a>}{preview.reviewFocus && <a href="#template-notes">{t('Production notes')}</a>}{preview.motionGuideUrl && <a href="#template-guide">{t('Motion guide')}</a>}</aside>
          <div>{preview.styleDescription && <section id="template-style"><h3>{t('Visual style')}</h3><p>{preview.styleDescription}</p></section>}{preview.reviewFocus && <section id="template-notes"><h3>{t('Production notes')}</h3><p>{preview.reviewFocus}</p></section>}{preview.motionGuideUrl && <section id="template-guide"><h3>{t('Motion guide')}</h3><iframe src={preview.motionGuideUrl} title={t('Motion guide')} sandbox="allow-scripts" loading="lazy" referrerPolicy="no-referrer" /><a href={preview.motionGuideUrl} target="_blank" rel="noreferrer">{t('View full page')} ↗</a></section>}</div>
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
