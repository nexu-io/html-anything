import type { GalleryTemplate } from '../../../shared/catalog';
import verifiedSnapshot from './githubRepositorySnapshot.json';

export const VERIFIED_REPOSITORY_STARS = verifiedSnapshot.stars;

export const GITHUB_REPOSITORY = 'https://github.com/nexu-io/openmotion';
const STARS_API = 'https://api.github.com/repos/nexu-io/openmotion';
const CACHE_KEY = 'openmotion.github-stars';
const CACHE_TTL = 60 * 60 * 1000;
type StarsCache = { count: number; at: number };

export function templateRepositoryUrl(template: GalleryTemplate): string {
  if (['product-promo', 'nyt-graph', 'decision-tree'].includes(template.id)) return `${GITHUB_REPOSITORY}/tree/main/template-library/${template.id}`;
  if (/^motion-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(template.id)) return `${GITHUB_REPOSITORY}/tree/main/library/templates/catalog/${template.id}`;
  return `${GITHUB_REPOSITORY}/tree/main/library/templates`;
}

/** One public request shared by both headers; persisted successes survive reloads. */
export function createRepositoryStarsReader() {
  let cached: StarsCache | undefined;
  let pending: Promise<number | null> | undefined;
  let retryAt = 0;
  return function readStars(): Promise<number | null> {
    if (!cached) {
      try {
        const value = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as StarsCache | null;
        if (value && Number.isSafeInteger(value.count) && value.count >= 0 && Number.isFinite(value.at) && value.at <= Date.now()) cached = value;
      } catch { /* Unavailable or invalid storage must not affect navigation. */ }
    }
    if ((cached && Date.now() - cached.at < CACHE_TTL) || Date.now() < retryAt) return Promise.resolve(cached?.count ?? VERIFIED_REPOSITORY_STARS);
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetch(STARS_API, { credentials: 'omit', headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('GitHub unavailable');
        const { stargazers_count: count } = await response.json();
        if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid star count');
        cached = { count, at: Date.now() };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(cached)); } catch { /* Memory cache remains available. */ }
        return count as number;
      } catch {
        retryAt = Date.now() + 60_000;
        return cached?.count ?? VERIFIED_REPOSITORY_STARS;
      } finally { pending = undefined; }
    })();
    return pending;
  };
}

export const readRepositoryStars = createRepositoryStarsReader();
