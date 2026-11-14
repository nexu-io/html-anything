import { GitHubLink } from './GitHubLink';
import { GithubLogo } from '@phosphor-icons/react';
import { templateRepositoryUrl } from './githubRepository';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isEditableTemplate, type GalleryTemplate, type TemplatePage } from '../../../shared/catalog';
import { templatePrompt, type IntegrationInfo } from '../../../shared/integration';
import { useI18n } from '../i18n/I18n';
import { motionApi } from './useWorkspace';
import { MotionIcon } from './icons';
import { Menu, MenuCheckboxItem, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from '../components/ui/Menu';
import { Skeleton } from '../components/ui/Skeleton';
import { StudioToastViewport } from '../components/StudioToastViewport';
import { useToast } from '../hooks/useToast';
import { purposeOrder } from './templateDiscoveryTaxonomy';
import { templateContributionUrl, templateSubmissionPrompt } from './templateContribution';
import styles from './TemplateLibraryDialog.module.css';
import { TemplateMotionGuide } from './TemplateMotionGuide';
import figmaLogo from './template-brands/figma.png';
import lovableLogo from './template-brands/lovable.svg';
import linearLogo from './template-brands/linear.svg';
import firecrawlLogo from './template-brands/firecrawl.png';
import kimiLogo from './template-brands/kimi.png';
import pondLogo from './template-brands/pond.svg';
import notionLogo from './template-brands/notion.png';
import higgsfieldLogo from './template-brands/higgsfield.png';
import { facetValues as values, templateFacets as facets, templateAspect, templateRatio, relatedTemplates, randomTemplate, type Facet } from './templateDiscovery';
import { useTemplatePlayback } from './useTemplatePlayback';
import { useTemplateImpressions } from './useTemplateImpressions';
import * as tracking from './templateLibraryTracking';
import type { DetailView, FilterAction, FilterGroup, Placement, Sort } from './templateLibraryTracking';

const brandLogos: Record<string, string> = { Notion: notionLogo, Higgsfield: higgsfieldLogo, Figma: figmaLogo, Lovable: lovableLogo, Linear: linearLogo, Firecrawl: firecrawlLogo, Kimi: kimiLogo, Pond: pondLogo };

function Identity({ template, brand = false }: { template: GalleryTemplate; brand?: boolean }) {
  const name = brand ? template.brand || template.author : template.authorName || template.author || template.brand || 'OpenMotion';
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const candidates = [!brand && template.authorAvatarUrl, template.brandLogoUrl, brandLogos[template.brand ?? '']];
  const url = candidates.find((candidate): candidate is string => Boolean(candidate) && !failedUrls.includes(candidate as string));
  return <span className={styles.avatar} aria-hidden="true">{name.slice(0, 1)}{url
    && <img src={url} alt="" loading="lazy" onError={() => setFailedUrls(previous => [...previous, url])} />}</span>;
}

function TemplatePoster({ template, eager = false }: { template: GalleryTemplate; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false);
  return <div className={styles.poster} data-loaded={loaded}>
    {!loaded && <Skeleton className={styles.posterSkeleton} animated={false} />}
    {(!template.posterUrl || failed) && <div className={styles.posterFallback}><MotionIcon name="film" size={26} /><span>{template.title}</span></div>}
    {template.posterUrl && !failed && <img src={template.posterUrl} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} style={{ opacity: loaded ? 1 : 0 }} />}
  </div>;
}

function DetailMedia({ template }: { template: GalleryTemplate }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false), [waiting, setWaiting] = useState(true), [failed, setFailed] = useState(false);
  const [attempt, retry] = useState(0);
  return <div className={styles.stageMedia} style={{ aspectRatio: templateAspect(template), width: `min(100%, calc(var(--stage-media-height) * ${templateAspect(template)}))` }} aria-busy={Boolean(template.previewUrl && waiting && !failed)}>
    <TemplatePoster template={template} eager />
    {template.previewUrl && !failed && <video key={attempt} src={template.previewUrl} controls autoPlay muted playsInline loop preload="metadata"
      style={{ opacity: ready ? 1 : 0 }} onLoadedData={() => { setReady(true); setWaiting(false); }} onPlaying={() => setWaiting(false)} onCanPlay={() => setWaiting(false)} onWaiting={() => setWaiting(true)} onStalled={() => setWaiting(true)} onPause={() => setWaiting(false)} onError={() => { setFailed(true); setWaiting(false); }} />}
    {template.previewUrl && waiting && !failed && <div className={styles.mediaLoading} role="status"><span>{t('Loading preview…')}</span><Skeleton className={styles.mediaProgress} /></div>}
    {failed && <div className={styles.mediaFailure} role="status"><span>{t('Preview unavailable. Try again.')}</span><button onClick={() => { setReady(false); setWaiting(true); setFailed(false); retry(value => value + 1); }}>{t('Retry')}</button></div>}
  </div>;
}

const TemplateCard = memo(function TemplateCard({ template, onSelect, active, onPriority }: { template: GalleryTemplate; onSelect: (template: GalleryTemplate) => void; active: boolean; onPriority: (id: string | null) => void }) {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element || !active || !template.previewUrl || failed) return;
    let cancelled = false;
    element.src = template.previewUrl;
    void element.play().catch(() => { if (!cancelled) setPlaying(false); });
    return () => {
      cancelled = true; element.pause(); element.removeAttribute('src'); element.load(); setPlaying(false);
    };
  }, [active, template.previewUrl, failed]);
  return <article className={styles.card} data-template-id={template.id} data-has-video={Boolean(template.previewUrl)}>
    <button className={styles.cover} style={{ aspectRatio: Math.max(0.8, Math.min(1.9, templateAspect(template))) }} onClick={() => onSelect(template)}
      onMouseEnter={() => onPriority(template.id)} onMouseLeave={() => onPriority(null)} onFocus={() => onPriority(template.id)} onBlur={() => onPriority(null)}
      aria-label={t('Preview template {title}', { title: template.title })}>
      <TemplatePoster template={template} />
      {template.previewUrl && <video ref={video} muted playsInline loop preload="none" aria-hidden="true" onPlaying={() => setPlaying(true)} onError={() => { setFailed(true); setPlaying(false); }} style={{ opacity: active && playing ? 1 : 0 }} />}
      <span className={styles.cardShade} />
      <span className={styles.cardTop}><span>{t(isEditableTemplate(template) ? 'Ready to edit' : template.styles?.[0] || 'Motion design')}</span>{template.duration != null && <span>{t('{value}s', { value: Number(template.duration.toFixed(1)) })}</span>}</span>
      <span className={styles.cardBottom}><Identity template={template} /><span className={styles.cardCaption}><strong>{template.title}</strong><small>{template.authorName || template.author || template.brand}</small></span><span className={styles.cardArrow}><MotionIcon name="arrow-up-right" size={18} /></span></span>
    </button>
  </article>;
});

type Props = { returnFocus?: HTMLElement | null; open: boolean; busy: boolean; openingDisabled?: boolean; error: string; onClose: () => void; onOpen: (id: string) => void };

/** Full-window discovery using the existing catalog and guarded editable-project actions. */
export function TemplateLibraryDialog(props: Props) {
  const { t, locale } = useI18n();
  const { toasts, showToast, dismissToast } = useToast();
  const dialog = useRef<HTMLDialogElement>(null), detail = useRef<HTMLDialogElement>(null);
  const libraryClose = useRef<HTMLButtonElement>(null);
  const detailInfo = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null);
  const instructionText = useRef<HTMLElement>(null), libraryShown = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [catalog, setCatalog] = useState<GalleryTemplate[]>([]);
  const [warning, setWarning] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [attempt, retry] = useState(0), [query, setQuery] = useState(''), [sort, setSort] = useState<Sort>('recommended');
  const [selected, setSelected] = useState<Partial<Record<Facet, string[]>>>({});
  const [preview, setPreview] = useState<GalleryTemplate | null>(null), [prompt, setPrompt] = useState(''), [feedback, setFeedback] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const [promptError, setPromptError] = useState(false), [promptAttempt, retryPrompt] = useState(0);
  const [priority, setPriority] = useState<string | null>(null), [filtersOpen, setFiltersOpen] = useState(false);
  const [editableOnly, setEditableOnly] = useState(false);
  const [brandsOnly, setBrandsOnly] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false), [guideOpen, setGuideOpen] = useState(false);
  const lastRandom = useRef<string>(undefined);
  const info = useRef<IntegrationInfo | null>(null);
  // Tracking state. Ids tie one detail view, one copy and one search to the events that follow from them.
  const detailView = useRef<DetailView | undefined>(undefined), searchId = useRef<string | undefined>(undefined), reportedQuery = useRef(''), shown = useRef(false);
  const pendingResult = useRef<FilterAction | undefined>(undefined), composing = useRef(false), shownCards = useRef(new Set<string>()), instructionShown = useRef<string | undefined>(undefined);
  const [settle, setSettle] = useState(0);
  useEffect(() => { if (props.open && props.error) showToast(props.error, 'error'); }, [props.open, props.error, showToast]);
  useEffect(() => { if (props.open && warning) showToast(warning, 'info'); }, [props.open, warning, showToast]);
  useEffect(() => {
    if (!props.open || !props.busy) return;
    const id = showToast('Preparing editable project…', 'info');
    return () => dismissToast(id);
  }, [props.open, props.busy, showToast, dismissToast]);
  useEffect(() => {
    if (!props.open) { libraryShown.current = false; return; }
    const openedDialog = dialog.current;
    const trigger = props.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    openedDialog?.showModal();
    if (openedDialog?.open && !libraryShown.current) { libraryShown.current = true; tracking.reportLibraryShown(); }
    libraryClose.current?.focus({ preventScroll: true });
    return () => {
      detail.current?.close(); openedDialog?.close(); setPreview(null);
      setPriority(null); setFiltersOpen(false);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [props.open, props.returnFocus]);
  useEffect(() => {
    if (!props.open) return;
    setCatalog([]); setSelected({}); setBrandsOnly(false); setQuery(''); setPreview(null); detail.current?.close();
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
        if (!controller.signal.aborted) { setCatalog(items); shown.current = true; }
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
  const categories = [...(available.find(facet => facet.key === 'uses')?.values ?? [])].sort((a, b) => {
    const rank = (value: string) => purposeOrder.includes(value) ? purposeOrder.indexOf(value) : purposeOrder.length;
    return rank(a) - rank(b);
  });
  const industries = available.find(facet => facet.key === 'industries')?.values ?? [];
  const sortOptions = [['recommended', 'Recommended order'], ['name', 'Name A–Z'], ['reverse', 'Name Z–A'], ['duration', 'Duration']] as const;
  const filterLabel = (key: Facet, label: string) => t(key === 'uses' ? 'By video purpose' : key === 'industries' ? 'By industry' : label);
  const hasFilters = Boolean(query || editableOnly || brandsOnly || Object.values(selected).some(items => items?.length));
  const visible = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return catalog.filter(item => {
      const text = [item.id, item.title, item.description, item.authorName, item.author, ...item.tags, ...facets.flatMap(([key]) => values(item, key).flatMap(value => [value, t(value)]))].join(' ').toLocaleLowerCase();
      return (!brandsOnly || Boolean(item.brand?.trim())) && (!editableOnly || isEditableTemplate(item)) && terms.every(term => text.includes(term)) && facets.every(([key]) => !selected[key]?.length || selected[key]!.some(value => values(item, key).includes(value)));
    }).sort((a, b) => sort === 'recommended' ? (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) : sort === 'duration' ? (a.duration ?? Infinity) - (b.duration ?? Infinity) : a.title.localeCompare(b.title, locale) * (sort === 'reverse' ? -1 : 1));
  }, [catalog, query, selected, sort, locale, editableOnly, brandsOnly]);
  useEffect(() => { if (dialog.current) dialog.current.scrollTop = 0; }, [query, selected, sort, editableOnly, brandsOnly]);
  const filterCount = Object.values(selected).flat().length + Number(editableOnly) + Number(brandsOnly);
  // A search id belongs to exactly one keyword: once the box holds something else, events stop carrying it.
  // The list state is read when a handler, timer or effect fires, not when it was scheduled.
  const latest = useRef({ items: visible, query, sort, filterCount, covered: false }); latest.current = { items: visible, query, sort, filterCount, covered: Boolean(preview) };
  const listContext = useCallback(() => {
    const { query, sort, filterCount } = latest.current, keyword = query.trim();
    return { searchId: keyword && keyword === reportedQuery.current ? searchId.current : undefined, sort, filterCount };
  }, []);
  // One search report per settled query: 500 ms after typing stops, or right before the user acts on the results,
  // and never mid-composition or before the catalogue has loaded. Each new keyword gets a new search id.
  const settleSearch = () => {
    const keyword = query.trim();
    if (!keyword || keyword === reportedQuery.current || composing.current || loading || !shown.current) return;
    const id = tracking.newTrackingId(); reportedQuery.current = keyword; searchId.current = id;
    tracking.reportSearchResult(id, query, visible.length, { sort, filterCount });
  };
  const settleLatest = useRef(settleSearch); settleLatest.current = settleSearch;
  useEffect(() => {
    if (!query.trim()) { reportedQuery.current = ''; searchId.current = undefined; return; }
    const timer = setTimeout(() => settleLatest.current(), 500);
    return () => clearTimeout(timer);
  }, [query, settle, loading, catalog.length]);
  // A filter, category or sort result is reported after the changed list has rendered, with the count the user now sees.
  useEffect(() => {
    const action = pendingResult.current; pendingResult.current = undefined;
    if (action) tracking.reportFilterResult(action, latest.current.items.length, listContext());
  }, [selected, sort, query, editableOnly, brandsOnly]);
  // One result set per search, filter and sort combination: a card is reported again only when that combination changes.
  // Empty groups are dropped and groups and values sorted, so the same choices always make the same key.
  const resultSet = JSON.stringify([query.trim(), sort, editableOnly, brandsOnly, Object.entries(selected).filter(([, items]) => items?.length).map(([key, items]) => [key, [...items!].sort()]).sort(([a], [b]) => String(a).localeCompare(String(b)))]);
  const resultSetLatest = useRef(resultSet); resultSetLatest.current = resultSet;
  const cardSeen = useCallback((id: string) => {
    const { items, covered } = latest.current;
    if (document.hidden || covered) return false;
    const key = `${resultSetLatest.current}|${id}`, index = items.findIndex(item => item.id === id);
    if (index < 0 || shownCards.current.has(key)) return true;
    shownCards.current.add(key);
    settleLatest.current();
    tracking.reportCardShown(items[index], index + 1, listContext());
    return true;
  }, [listContext]);
  useTemplateImpressions(dialog, visible.map(item => item.id).join(','), props.open && !preview, resultSet, cardSeen);
  const active = useTemplatePlayback(dialog, visible.map(item => item.id).join(','), props.open && !preview, true, priority);
  const related = useMemo(() => preview ? relatedTemplates(preview, catalog) : [], [preview, catalog]);
  const previewIndex = visible.findIndex(item => item.id === preview?.id);
  const clear = () => { setQuery(''); setSelected({}); setEditableOnly(false); setBrandsOnly(false); };
  const reset = () => {
    if (hasFilters) { tracking.reportDiscoveryClick('filter_clear', listContext()); pendingResult.current = 'filter_clear'; }
    clear();
  };
  // `control` is where the option was picked: the purpose bar and industry menu report a category choice, the filter menu and chips a filter option.
  const picked = (control: 'category_select' | 'filter_option', group: FilterGroup, option: string | undefined, isSelected: boolean) => {
    settleSearch();
    tracking.reportDiscoveryClick(control, listContext(), { filter_group: group, option, selected: isSelected });
    pendingResult.current = control === 'category_select' ? 'category_select' : 'filter_apply';
  };
  const toggle = (key: Facet, value: string) => {
    picked('filter_option', key, value, !selected[key]?.includes(value));
    setSelected(previous => ({ ...previous, [key]: previous[key]?.includes(value) ? previous[key]!.filter(item => item !== value) : [...(previous[key] ?? []), value] }));
  };
  const chooseCategory = (key: 'uses' | 'industries', value: string | undefined) => {
    const next = value === undefined || (key === 'uses' && selected.uses?.includes(value)) ? [] : [value];
    picked('category_select', key, value, next.length > 0);
    if (key === 'uses') setBrandsOnly(false);
    setSelected(previous => ({ ...previous, [key]: next }));
  };
  const chooseBrands = (next: boolean) => {
    picked(next ? 'category_select' : 'filter_option', 'brand', 'top-100-brands', next);
    setBrandsOnly(next);
    if (next) setSelected(previous => ({ ...previous, uses: [] }));
  };
  const toggleEditable = (next: boolean) => { picked('filter_option', 'editable', undefined, next); setEditableOnly(next); };
  const changeSort = (value: string) => {
    const next = tracking.asSort(value);
    settleSearch();
    tracking.reportDiscoveryClick('sort_option', { ...listContext(), sort: next }, { previous_sort: sort, changed: next !== sort });
    if (next !== sort) pendingResult.current = 'sort_change';
    setSort(next);
  };
  const openFilters = (next: boolean) => { if (next && !filtersOpen) tracking.reportDiscoveryClick('filter_open', listContext()); setFiltersOpen(next); };
  const show = useCallback((item: GalleryTemplate, placement: Placement = 'catalog') => {
    const view = { id: tracking.newTrackingId(), placement }; detailView.current = view; instructionShown.current = undefined;
    const index = latest.current.items.findIndex(candidate => candidate.id === item.id);
    tracking.reportDetailShown(item, view, placement === 'related' || index < 0 ? undefined : index + 1);
    setPreview(item); setPrompt(''); setPromptError(false); setFeedback(''); setManualCopy(''); setPromptExpanded(false); setGuideOpen(false);
    if (detailInfo.current) detailInfo.current.scrollTop = 0;
    if (!detail.current?.open) detail.current?.showModal();
  }, []);
  const openCard = useCallback((item: GalleryTemplate) => {
    settleLatest.current();
    tracking.reportCardOpened(item, 'catalog', latest.current.items.findIndex(candidate => candidate.id === item.id) + 1, listContext());
    show(item, 'catalog');
  }, [show, listContext]);
  const openRelated = (item: GalleryTemplate, position: number) => { tracking.reportCardOpened(item, 'related', position, listContext()); show(item, 'related'); };
  const navigate = (step: number) => {
    if (visible.length < 2) return;
    tracking.reportDetailStep(preview, step, detailView.current);
    show(visible[previewIndex < 0 ? (step > 0 ? 0 : visible.length - 1) : (previewIndex + step + visible.length) % visible.length], 'navigation');
  };
  const surprise = () => {
    settleSearch();
    const item = randomTemplate(visible, lastRandom.current);
    if (item) { tracking.reportSurprise(listContext(), visible.length); lastRandom.current = item.id; show(item, 'random'); }
  };
  // The instruction counts as shown once its text is on screen, once per detail view.
  useEffect(() => {
    const view = detailView.current;
    const target = instructionText.current?.querySelector('p, textarea');
    if (!props.open || !preview || !prompt || !view || !target || instructionShown.current === view.id
      || typeof IntersectionObserver === 'undefined') return;
    const threshold = 0.01; // A positive threshold notifies again after zero-area edge contact.
    let visible = false;
    const report = () => {
      if (!visible || document.hidden || !detail.current?.open || detailView.current?.id !== view.id || instructionShown.current === view.id) return;
      instructionShown.current = view.id; tracking.reportInstructionShown(preview, view); observer.disconnect();
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= threshold); report();
    }, { root: detail.current, threshold });
    observer.observe(target);
    document.addEventListener('visibilitychange', report);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', report); };
  }, [props.open, preview, prompt, manualCopy]);
  useEffect(() => {
    if (!preview) return;
    setPromptError(false);
    let cancelled = false;
    async function loadPrompt() {
      try {
        const connection = info.current ?? await motionApi<IntegrationInfo>('/integration'); info.current = connection;
        if (!cancelled) setPrompt(templatePrompt(connection, 'codex', preview!, locale));
      } catch { if (!cancelled) setPromptError(true); }
    }
    void loadPrompt();
    return () => { cancelled = true; };
  }, [preview, locale, promptAttempt]);
  /** `origin` is the control used: a recreate button reports the intent to use, the instruction's own button a copy click. */
  async function copy(submit = false, origin: 'recreate' | 'instruction' = 'recreate') {
    if (!prompt) return;
    const text = submit ? templateSubmissionPrompt(prompt) : prompt;
    const template = preview, view = detailView.current, attemptId = tracking.newTrackingId();
    if (template && origin === 'recreate') tracking.reportUseClicked(template, submit ? 'recreate_submit' : 'recreate', view, attemptId);
    else if (template) tracking.reportCopyClicked(template, attemptId, view);
    try {
      await navigator.clipboard.writeText(text); setManualCopy(''); setFeedback('Copied. Paste into your Agent.'); showToast('Copied. Paste into your Agent.', 'info');
      if (template) tracking.reportCopyResult(template, 'clipboard_written', attemptId, submit, view);
    } catch {
      setManualCopy(text); setPromptExpanded(true); setFeedback(''); showToast('Copy failed. Select and copy the instruction below.', 'error', 'feedback');
      if (template) tracking.reportCopyResult(template, 'manual_fallback_shown', attemptId, submit, view);
    }
  }
  async function downloadMotion() {
    if (!preview?.motionDocumentUrl) return;
    const template = preview, view = detailView.current, attemptId = tracking.newTrackingId();
    tracking.reportDownloadClicked(template, 'download_guide', attemptId, view);
    let errorCode = 'FETCH_ERROR';
    setDownloading(true);
    try {
      const response = await fetch(preview.motionDocumentUrl, { credentials: 'omit' });
      if (!response.ok) { errorCode = `HTTP_${response.status}`; throw new Error(`Download HTTP ${response.status}`); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'motion.md'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      tracking.reportDownloadResult(template, attemptId, 'browser_save_requested', undefined, view);
    } catch { showToast('Download failed. Please try again.', 'error', 'feedback'); tracking.reportDownloadResult(template, attemptId, 'fetch_failed', errorCode, view); }
    finally { setDownloading(false); }
  }
  const filterBy = (key: Facet, value: string) => { picked('filter_option', key, value, true); setSelected({ [key]: [value] }); setQuery(''); setEditableOnly(false); setBrandsOnly(false); detail.current?.close(); };
  return <dialog ref={dialog} className={styles.library} data-motion-template-library="" aria-label={t('Template library')} onKeyDown={event => {
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !preview && !filtersOpen) { event.preventDefault(); search.current?.focus(); }
  }} onCancel={event => { if (event.target !== dialog.current) return; event.preventDefault(); if (!props.busy) props.onClose(); }}>
    <div className={styles.stickyHeader}>
      <header className={styles.header}>
        <div className={styles.wordmark}><MotionIcon name="film" size={22} /><strong>OpenMotion</strong><span>{t('Template library')}</span></div>
        <label className={styles.search}><MotionIcon name="search" size={18} /><input ref={search} type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; setSettle(value => value + 1); }} placeholder={t('Search templates, creators, styles…')} aria-label={t('Search templates')} /><kbd>⌘ K</kbd></label>
        <GitHubLink />
        <button ref={libraryClose} className={styles.iconButton} disabled={props.busy} onClick={props.onClose} aria-label={t('Close template library')} title={t('Close template library')}><MotionIcon name="close" size={22} /></button>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.categories} role="group" aria-label={t('Video purpose')}>
          <button aria-pressed={!brandsOnly && !selected.uses?.length} onClick={() => chooseCategory('uses', undefined)}>{t('All')}</button>
          <button aria-label={t('TOP 100 brands')} aria-pressed={brandsOnly} onClick={() => chooseBrands(true)}><span className="ui-collection-label" aria-hidden="true"><span className="ui-collection-label__title">TOP 100</span><span>{t('Brands')}</span></span></button>
          {categories.map(value => <button key={value} aria-pressed={selected.uses?.includes(value) ?? false} onClick={() => chooseCategory('uses', value)}>{t(value)}</button>)}
        </div>
        <div className={styles.controls}>
          {industries.length > 0 && <Menu modal={false} container={null} align="start" aria-label={t('By industry')} className={styles.discoveryMenu}
            trigger={<button className={styles.dropdownButton}><span>{selected.industries?.length === 1 ? t(selected.industries[0]) : t('By industry')}</span>{(selected.industries?.length ?? 0) > 1 && <span className={styles.filterCount}>{selected.industries!.length}</span>}<MotionIcon name="chevron-down" size={16} /></button>}>
            <MenuRadioGroup value={selected.industries?.length === 1 ? selected.industries[0] : selected.industries?.length ? '' : 'all'} onValueChange={value => chooseCategory('industries', value === 'all' ? undefined : value)}>
              <MenuRadioItem value="all">{t('All industries')}</MenuRadioItem>
              {industries.map(value => <MenuRadioItem key={value} value={value}>{t(value)}</MenuRadioItem>)}
            </MenuRadioGroup>
          </Menu>}
          <Menu modal={false} open={filtersOpen} onOpenChange={openFilters} container={null} align="end" aria-label={t('Filters')} className={`${styles.discoveryMenu} ${styles.filterMenu}`}
            trigger={<button className={`${styles.dropdownButton} ${styles.filterIcon}`} aria-label={t('Filters')} title={t('Filters')}><MotionIcon name="sliders" size={17} />{(Object.values(selected).flat().length + Number(editableOnly)) > 0 && <span className={styles.filterIndicator} aria-hidden="true" />}</button>}>
            <MenuCheckboxItem checked={editableOnly} onCheckedChange={toggleEditable} closeOnClick={false}>{t('Ready to edit')}</MenuCheckboxItem>
            {available.filter(facet => facet.key !== 'industries').map(facet => <div key={facet.key} role="group" aria-label={filterLabel(facet.key, facet.label)}>
              <MenuSeparator /><div className={styles.menuHeading}>{filterLabel(facet.key, facet.label)}</div>
              {facet.values.map(value => <MenuCheckboxItem key={value} checked={selected[facet.key]?.includes(value) ?? false} onCheckedChange={() => toggle(facet.key, value)} closeOnClick={false}>
                <span className={styles.facetOption}>{facet.key === 'brand' && <Identity template={catalog.find(item => item.brand === value)!} brand />}{facet.key === 'brand' ? value : t(value)}</span>
              </MenuCheckboxItem>)}
            </div>)}
            <MenuSeparator /><MenuItem disabled={!hasFilters} closeOnClick={false} onClick={reset}>{t('Clear filters')}</MenuItem>
          </Menu>
          <div className={styles.sortControl}><Menu modal={false} container={null} align="end" aria-label={t('Sort')} className={styles.discoveryMenu}
            trigger={<button className={styles.dropdownButton} aria-label={t('Sort')}><span>{t(sortOptions.find(([value]) => value === sort)![1])}</span><MotionIcon name="chevron-down" size={16} /></button>}>
            <MenuRadioGroup value={sort} onValueChange={changeSort}>{sortOptions.map(([value, label]) => <MenuRadioItem key={value} value={value}>{t(label)}</MenuRadioItem>)}</MenuRadioGroup>
          </Menu></div>
        </div>
      </div>
      {hasFilters && <div className={styles.chips}>{brandsOnly && <button onClick={() => chooseBrands(false)} aria-label={t('Remove filter {value}', { value: t('TOP 100 brands') })}>{t('TOP 100 brands')}<MotionIcon name="close" size={12} /></button>}{query && <button onClick={() => setQuery('')} aria-label={t('Remove filter {value}', { value: query })}><MotionIcon name="search" size={12} />{query}<MotionIcon name="close" size={12} /></button>}{facets.flatMap(([key]) => (selected[key] ?? []).map(value => <button key={key + value} onClick={() => toggle(key, value)} aria-label={t('Remove filter {value}', { value: t(value) })}>{key === 'brand' ? value : t(value)}<MotionIcon name="close" size={12} /></button>))}{editableOnly && <button onClick={() => toggleEditable(false)}>{t('Ready to edit')}<MotionIcon name="close" size={12} /></button>}<button onClick={reset}>{t('Clear filters')}</button><span>{t('{count} templates', { count: visible.length })}</span></div>}
    </div>
    <main className={styles.results} aria-busy={loading}>
      <div className={styles.grid}>
        <section className={styles.intro}><span className={styles.eyebrow}>{t('Made to move.')}</span><h1>{t('Find your next motion.')}</h1><p>{t('Explore the details. Find a direction. Make it your own.')}</p><div className={styles.introActions}><button className={styles.surprise} disabled={!visible.length || loading} onClick={surprise}><MotionIcon name="sparkles" size={17} />{t('Surprise me')}<MotionIcon name="arrow-up-right" size={16} /></button><a className={styles.submitVideo} href={templateContributionUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportDiscoveryClick('submit_video', listContext())}>{t('Submit video')}<MotionIcon name="arrow-up-right" size={15} /></a></div><small>{loading && !catalog.length ? t('Loading templates…') : t('{count} templates', { count: visible.length })}</small></section>
        {loading && !catalog.length && Array.from({ length: 12 }, (_, index) => <div key={index} className={styles.skeletonCard} aria-hidden="true"><Skeleton style={{ aspectRatio: [1.35, 1.78, 1, 1.78][index % 4] }} /><div><Skeleton style={{ width: 28, height: 28, borderRadius: '50%' }} /><Skeleton style={{ width: '55%', height: 9 }} /></div></div>)}
        {visible.map(item => <TemplateCard key={item.id} template={item} onSelect={openCard} active={active.has(item.id)} onPriority={setPriority} />)}
      </div>
      {loading && !catalog.length && <span className={styles.visuallyHidden} role="status">{t('Loading templates…')}</span>}
      {error && <div className={styles.empty} role="alert"><p>{t(error)}</p><button onClick={() => retry(value => value + 1)}>{t('Retry')}</button></div>}
      {!loading && !visible.length && !error && <div className={styles.empty}><MotionIcon name="search" size={28} /><p>{t('No matching templates. Try another name, creator or style.')}</p><button onClick={reset}>{t('Clear filters')}</button></div>}
    </main>
    <dialog ref={detail} className={styles.detail} aria-label={t('Template preview')} onClose={() => { setPreview(null); setPrompt(''); detailView.current = undefined; }} onKeyDown={event => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, video')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      {preview && <div className={styles.detailGrid}>
        <div className={styles.stage}>
          {preview.posterUrl && <img className={styles.ambient} src={preview.posterUrl} alt="" aria-hidden="true" />}
          <div className={styles.stageGlass} />
          <DetailMedia key={preview.id} template={preview} />
        </div>
        <div ref={detailInfo} className={styles.detailInfo}>
          <div className={styles.detailNav}><button className={styles.iconButton} autoFocus onClick={() => detail.current?.close()} aria-label={t('Close template preview')}><MotionIcon name="close" size={20} /></button><span>{previewIndex >= 0 ? `${previewIndex + 1} / ${visible.length}` : t('Related templates')}</span><button className={styles.iconButton} disabled={visible.length < 2} onClick={() => navigate(-1)} aria-label={t('Previous template')}><MotionIcon name="arrow-left" size={18} /></button><button className={styles.iconButton} disabled={visible.length < 2} onClick={() => navigate(1)} aria-label={t('Next template')}><MotionIcon name="arrow-right" size={18} /></button></div>
          <div className={styles.detailBody}>
            <h2>{preview.title}</h2>
            <a className={styles.repositoryLink} href={templateRepositoryUrl(preview)} target="_blank" rel="noreferrer" onClick={() => tracking.reportDetailLink(preview, 'view_repository', detailView.current)}><GithubLogo size={16} weight="fill" aria-hidden="true" />{t('View on GitHub')}<MotionIcon name="arrow-up-right" size={14} /></a>
            <div className={styles.creator}><Identity template={preview} /><div><strong>{preview.authorName || preview.author || preview.brand || 'OpenMotion'}</strong>{preview.brand && preview.brand.trim().toLocaleLowerCase() !== (preview.authorName || preview.author || preview.brand).trim().toLocaleLowerCase() && <small>{preview.brand}</small>}</div>{preview.sourceUrl && <a href={preview.sourceUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportDetailLink(preview, 'view_source', detailView.current)} aria-label={t('Source')} title={t('Source')}><MotionIcon name="arrow-up-right" size={18} /></a>}</div>
            {preview.description && <p className={styles.description}>{preview.description}</p>}
            <div className={styles.actions}>{isEditableTemplate(preview) && <button className={styles.primary} disabled={props.busy || props.openingDisabled} onClick={() => { tracking.reportUseClicked(preview, 'open_edit', detailView.current); detail.current?.close(); props.onOpen(preview.id); }}>{t('Open and edit')}<MotionIcon name="arrow-up-right" size={16} /></button>}<div className={styles.recreateActions}><button disabled={!prompt} onClick={() => void copy()}>{t('Recreate template')}<MotionIcon name="sparkles" size={16} /></button><button className={styles.submitTemplate} disabled={!prompt} onClick={() => void copy(true)} aria-label={t('Recreate and submit')} title={t('Recreate and submit')}><MotionIcon name="git-branch" size={17} /></button></div></div>
            <section ref={instructionText} className={styles.instruction} aria-label={t('Template instruction')}><header><h3>{t('Template instruction')}</h3><button disabled={!prompt} onClick={() => void copy(false, 'instruction')}><MotionIcon name="copy" size={14} />{t(feedback === 'Copied. Paste into your Agent.' ? 'Copied' : 'Copy')}</button></header>{manualCopy ? <textarea className={styles.manualCopy} readOnly rows={8} value={manualCopy} aria-label={t('Content to copy')} onFocus={event => event.currentTarget.select()} /> : prompt ? <p className={promptExpanded ? styles.fullInstruction : styles.shortInstruction}>{prompt}</p> : promptError ? <div className={styles.promptFailure} role="status">{t('Could not load the instruction.')}<button onClick={() => retryPrompt(value => value + 1)}>{t('Retry')}</button></div> : <div className={styles.promptSkeleton} role="status" aria-label={t('Loading instruction…')}>{[100, 94, 100, 86, 62].map((width, index) => <Skeleton key={index} style={{ width: `${width}%`, height: 10 }} />)}</div>}<button disabled={!prompt} className={styles.expandInstruction} aria-expanded={promptExpanded} onClick={() => { tracking.reportInstructionExpanded(preview, !promptExpanded, detailView.current); setPromptExpanded(!promptExpanded); }}>{t(promptExpanded ? 'Show less' : 'Show instruction')}<MotionIcon name="chevron-down" size={14} /></button></section>
            <dl className={styles.metadata}>
              {preview.duration != null && <div><dt>{t('Duration')}</dt><dd>{t('{value}s', { value: Number(preview.duration.toFixed(1)) })}</dd></div>}
              {(preview.width || preview.ratio) && <div><dt>{t('Aspect ratio')}</dt><dd>{templateRatio(preview)}</dd></div>}
              {facets.filter(([key]) => !['duration', 'ratio'].includes(key)).map(([key, label]) => values(preview, key).length > 0 && <div key={key}><dt>{t(label)}</dt><dd>{values(preview, key).map(value => <button key={value} onClick={() => filterBy(key, value)}>{key === 'brand' ? value : t(value)}</button>)}</dd></div>)}
            </dl>
            {preview.tags.length > 0 && <div className={styles.tags}>{preview.tags.map(tag => <button key={tag} onClick={() => { clear(); setQuery(tag); detail.current?.close(); }}>{t(tag)}</button>)}</div>}
            {(preview.motionDocumentUrl || preview.projectFileUrl) && <div className={styles.projectActions}>{preview.motionDocumentUrl && <button disabled={downloading} onClick={() => void downloadMotion()}><MotionIcon name="download" size={15} />{t(downloading ? 'Downloading…' : 'Download motion.md')}</button>}{preview.projectFileUrl && <a href={preview.projectFileUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportDownloadClicked(preview, 'download_project', undefined, detailView.current)}>{t('Download OpenMotion project')}<MotionIcon name="arrow-up-right" size={14} /></a>}</div>}
            {(preview.styleDescription || preview.reviewFocus || preview.motionGuideUrl) && <section className={styles.guide} aria-label={t('Motion guide')}>
              {preview.styleDescription && <details><summary>{t('Visual style')}</summary><p>{preview.styleDescription}</p></details>}
              {preview.reviewFocus && <details><summary>{t('Production notes')}</summary><p>{preview.reviewFocus}</p></details>}
              {preview.motionGuideUrl && <details key={preview.id} onToggle={event => setGuideOpen(event.currentTarget.open)}><summary>{t('Motion guide')}</summary>{guideOpen && <TemplateMotionGuide url={preview.motionGuideUrl} title={t('Motion guide')} />}<a href={preview.motionGuideUrl} target="_blank" rel="noreferrer" onClick={() => tracking.reportDetailLink(preview, 'view_full_page', detailView.current)}>{t('View full page')}<MotionIcon name="arrow-up-right" size={14} /></a></details>}
            </section>}
            {related.length > 0 && <section className={styles.related}><h3>{t('Related templates')}</h3><div>{related.map((item, index) => <button key={item.id} onClick={() => openRelated(item, index + 1)} aria-label={t('Preview template {title}', { title: item.title })}><TemplatePoster template={item} /><span className={styles.relatedCaption}>{item.title}</span></button>)}</div></section>}
          </div>
        </div>
      </div>}
    </dialog>

    {props.open && <StudioToastViewport toasts={toasts} dismissToast={dismissToast} />}
  </dialog>;
}
