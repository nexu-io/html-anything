// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { GalleryTemplate } from '../../../shared/catalog';
import { createRepositoryStarsReader, GITHUB_REPOSITORY, templateRepositoryUrl } from './githubRepository';

beforeEach(() => localStorage.clear());
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('shares a single public star request and reuses persisted counts across readers', async () => {
  const fetcher = vi.fn(async () => Response.json({ stargazers_count: 9796 }));
  vi.stubGlobal('fetch', fetcher);
  const read = createRepositoryStarsReader();
  expect(await Promise.all([read(), read()])).toEqual([9796, 9796]);
  expect(await createRepositoryStarsReader()()).toBe(9796);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('https://api.github.com/repos/nexu-io/openmotion', expect.objectContaining({ credentials: 'omit' }));
});

it('hides an expired count when GitHub is unavailable, then retries after the cooldown', async () => {
  let now = 5_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  localStorage.setItem('openmotion.github-stars', JSON.stringify({ count: 9000, at: 1 }));
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 403 })).mockResolvedValueOnce(Response.json({ stargazers_count: 9796 }));
  vi.stubGlobal('fetch', fetcher);
  const read = createRepositoryStarsReader();
  expect(await read()).toBeNull();
  expect(await read()).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
  now += 61_000;
  expect(await read()).toBe(9796);
});

it('hides the count for malformed data instead of showing a snapshot', async () => {
  localStorage.setItem('openmotion.github-stars', 'invalid');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ stargazers_count: -1 })));
  expect(await createRepositoryStarsReader()()).toBeNull();
});

it('links repository templates and built-in projects to their exact public directories', () => {
  const template = (id: string) => ({ id }) as GalleryTemplate;
  expect(templateRepositoryUrl(template('product-promo'))).toBe(`${GITHUB_REPOSITORY}/tree/main/template-library/product-promo`);
  expect(templateRepositoryUrl(template('motion-dfb1a35a-a70e-489f-8e02-b74068fc0b8c'))).toBe(`${GITHUB_REPOSITORY}/tree/main/library/templates/catalog/motion-dfb1a35a-a70e-489f-8e02-b74068fc0b8c`);
  expect(templateRepositoryUrl(template('../invalid'))).toBe(`${GITHUB_REPOSITORY}/tree/main/library/templates`);
});

it.each([undefined, null, '9796', -1, 1.5])('rejects an invalid star count (%s)', async count => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ stargazers_count: count })));
  expect(await createRepositoryStarsReader()()).toBeNull();
});

it('accepts zero stars and refreshes a successful count after five minutes', async () => {
  let now = 5_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ stargazers_count: 0 })).mockResolvedValueOnce(Response.json({ stargazers_count: 123 }));
  vi.stubGlobal('fetch', fetcher);
  const read = createRepositoryStarsReader();
  expect(await read()).toBe(0);
  now += 299_000;
  expect(await read()).toBe(0);
  expect(fetcher).toHaveBeenCalledTimes(1);
  now += 2_000;
  expect(await read()).toBe(123);
});

it('hides the count when the request times out', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Timed out', 'TimeoutError'); }));
  expect(await createRepositoryStarsReader()()).toBeNull();
});
