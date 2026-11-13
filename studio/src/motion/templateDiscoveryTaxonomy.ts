import type { GalleryTemplate } from '../../../shared/catalog';
import { sourceMessage } from '../i18n/messages';
import purposeAliases from './templatePurposeAliases.json';

/** Discovery labels, not changes to the source catalog or its authored metadata. */
const purposes: Record<string, string> = {
  'Product launch': 'Product launch films',
  'Brand promotion': 'Brand & company films',
  'Product demo': 'Product demos & explainers',
  'Event promotion': 'Event & campaign films',
  'Partnership announcement': 'Partnership announcements',
  'Milestones and results': 'Milestones & results',
  Fundraising: 'Fundraising announcements',
};
export const purposeOrder = [
  'Product launch films', 'Brand & company films', 'Fundraising announcements',
  'Product demos & explainers', 'Event & campaign films', 'Milestones & results', 'Partnership announcements',
];

// These two catalog entries explicitly announce funding. Exact IDs keep this
// editorial classification stable when their titles are translated.
const fundraisingIds = new Set([
  'motion-87a0c9d5-89f0-49f8-8faf-343a44f2beb7',
  'motion-7b279560-81df-4c31-988d-473d35536c28',
]);
export function discoveryPurposes(template: GalleryTemplate): string[] {
  const values = (template.uses ?? []).map(value => purposes[purposeAliases[value as keyof typeof purposeAliases] ?? sourceMessage(value)] ?? sourceMessage(value));
  if (fundraisingIds.has(template.id)) values.unshift('Fundraising announcements');
  return [...new Set(values)];
}

// Conservative browsing collections for the repository catalog, whose industry
// arrays are currently empty. Published industry metadata takes precedence;
// unreviewed brands remain unclassified instead of being guessed from prose.
const industryBrands: [string, string[]][] = [
  ['AI & technology', ['OpenAI', 'Anthropic', 'Manus', 'xAI / Grok', 'Kimi', 'Mistral', 'ElevenLabs', 'Perplexity', 'Genspark', 'Nous Research', 'Cohere', 'Exa', 'Goodfire', 'Humans&', 'Prime Intellect', 'Z.ai', 'Higgsfield']],
  ['Business software', ['Linear', 'Notion', 'Lark', 'Slack', 'Airtable', 'Miro', 'Glean', 'Granola', 'Zapier']],
  ['Design & creative tools', ['Figma', 'Framer', 'Adobe', 'Canva', 'Jitter', 'Modyfi', 'Webflow', 'Krea', 'Ideogram', 'Runway', 'HeyGen', 'Descript', 'Rive']],
  ['Developer tools', ['Cursor', 'Vercel', 'GitHub', 'Supabase', 'Replit', 'Firecrawl', 'CodeRabbit', 'Cognition', 'Factory', 'Resend', 'Mintlify', 'Lovable', 'Emergent', 'Bolt']],
  ['Finance & payments', ['Stripe', 'Ramp', 'Revolut', 'Cash App', 'Bluevine', 'Wise', 'OKX']],
  ['Consumer electronics', ['Apple', 'Nothing', 'Xiaomi']],
  ['Music & entertainment', ['TIDAL', 'Deezer', 'Suno']],
  ['Healthcare', ['Suki']],
  ['Travel & mobility', ['Uber']],
];
export function discoveryIndustries(template: GalleryTemplate): string[] {
  if (template.industries?.length) return template.industries.map(value => sourceMessage(value));
  return industryBrands.filter(([, brands]) => brands.includes(template.brand ?? '')).map(([industry]) => industry);
}
