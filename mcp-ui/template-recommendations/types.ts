export const templateIds = ['product-promo', 'nyt-graph', 'decision-tree'] as const;
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'es' | 'pt';
export type TemplateId = typeof templateIds[number];
export type TemplateAsset = Readonly<{
  id: string; title: string; description: string; durationSeconds: number;
  videoBase64: string; posterBase64: string; posterMimeType: 'image/jpeg';
}>;
export type TemplateCardsBootstrap = Readonly<{ resourceVersion: string; templates: readonly TemplateAsset[] }>;
export type CreateArgs = Readonly<{
  requestId: string; projectType: 'template'; templateId: string; title: string; requirements: string;
}>;
export type RecommendationCard = Readonly<{
  position: number; templateId: string; title: string; description: string; durationSeconds: number;
  actionRequestId: string; createArgs: CreateArgs;
}>;
export type Recommendation = Readonly<{
  schemaVersion: 1; resourceVersion: string; recommendationId: string;
  cards: readonly RecommendationCard[]; selectionGuide: string;
  onboarding?: boolean; language?: Language;
}>;
export type HostContext = { locale?: string; theme?: string };
export type TemplateCardsHost = {
  sendMessage(params: { role: 'user'; content: { type: 'text'; text: string }[];
    _meta: { 'openai/message': { target: 'active'; send: false } } }): Promise<{ isError?: boolean; [key: string]: unknown }>;
  getHostCapabilities(): { message?: unknown; experimental?: Record<string, unknown> } | undefined;
  getHostContext?(): HostContext | undefined;
};
