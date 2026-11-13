import type { GalleryTemplate } from '../../../shared/catalog';
import { discoveryIndustries, discoveryPurposes } from './templateDiscoveryTaxonomy';

export type Facet = 'brand' | 'uses' | 'styles' | 'industries' | 'creationModels' | 'colors' | 'ratio' | 'duration';
export const templateFacets: [Facet, string][] = [
  ['uses', 'Video purpose'], ['industries', 'Industry'], ['styles', 'Motion style'],
  ['brand', 'Reference brands'], ['creationModels', 'Creation models'], ['colors', 'Colors'],
  ['ratio', 'Aspect ratio'], ['duration', 'Duration'],
];
export function facetValues(template: GalleryTemplate, key: Facet): string[] {
  if (key === 'uses') return discoveryPurposes(template);
  if (key === 'industries') return discoveryIndustries(template);
  if (key === 'brand') return template.brand ? [template.brand] : [];
  if (key === 'ratio') {
    if (!(template.width && template.height) && !template.ratio) return [];
    const ratio = templateAspect(template);
    return ratio === 1 ? ['Square'] : ratio > 1 ? ['Landscape'] : ['Portrait'];
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
export function templateAspect(template: GalleryTemplate): number {
  if (template.width && template.height) return template.width / template.height;
  const [w, h] = (template.ratio ?? '').split(/[:/]/).map(Number);
  return w > 0 && h > 0 ? w / h : 16 / 9;
}
export function relatedTemplates(template: GalleryTemplate, catalog: GalleryTemplate[]): GalleryTemplate[] {
  const score = (item: GalleryTemplate) => (item.brand && item.brand === template.brand ? 3 : 0)
    + (['styles', 'uses', 'tags'] as const).reduce((sum, key) => sum + (item[key] ?? []).filter(value => template[key]?.includes(value)).length, 0);
  return catalog.filter(item => item.id !== template.id).map(item => ({ item, score: score(item) }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map(({ item }) => item);
}
export function randomTemplate(items: GalleryTemplate[], previousId?: string, random = Math.random): GalleryTemplate | undefined {
  const candidates = items.length > 1 ? items.filter(item => item.id !== previousId) : items;
  return candidates[Math.floor(random() * candidates.length)];
}

export function templateRatio(template: GalleryTemplate): string {
  const [width, height] = template.width && template.height ? [template.width, template.height] : (template.ratio ?? '').split(/[:/]/).map(Number);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return template.ratio ?? '—';
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}
