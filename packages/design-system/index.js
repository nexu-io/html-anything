/** Browser-safe public asset contract. No dependency on Studio or the application server. */
export const designSystemBase = '/design-system';
export const designSystemAsset = (name) => `${designSystemBase}/${name}`;
export const brand = Object.freeze({
  productName: 'OpenMotion',
  editorName: 'OpenDesign',
  editorLogo: Object.freeze({ light: 'opendesign-dark.svg', dark: 'opendesign-light.svg' }),
  productLogo: 'brand/openmotion-logo.svg',
  loadingMark: 'brand/loading-mark.svg',
  favicon: 'brand/favicon.svg',
});
export const iconSprite = designSystemAsset('icons.svg');

/** Positive HTTP/distribution list: adding a file to the package does not expose it. */
export const publicDesignFiles = Object.freeze([
  'tokens.json', 'tokens.css', 'ui.css', 'fonts.css', 'base.css', 'controls.css', 'material.css',
  'loading.css', 'studio.css', 'studio/adapter.css', 'studio/control-states.css', 'studio/feedback.css',
  'index.html', 'theme.js', 'catalog.js', 'catalog-view.js', 'catalog.css', 'token-model.js', 'generate.js', 'icons.svg',
  'opendesign-dark.svg', 'opendesign-light.svg', 'brand/openmotion-logo.svg',
  'brand/loading-mark.svg', 'brand/loading-wordmark.svg', 'brand/favicon.svg',
  'fonts/AlbertSans-VariableFont_wght.ttf', 'fonts/IBMPlexMono-Regular.ttf',
  'fonts/Albert-Sans-OFL.txt', 'fonts/IBM-Plex-Mono-OFL.txt', 'fonts/NOTICES.txt',
  'remix-icon-LICENSE.txt', 'remix-icon-NOTICE.txt',
]);

export const designSystemDocuments = Object.freeze([
  'packages/design-system/README.md', 'packages/design-system/brand/BRANDKIT.md',
  'packages/design-system/brand/MOTION_DESIGN.md', 'packages/design-system/opendesign-logo-SOURCE.md',
]);

export const designSystemRuntimeFiles = Object.freeze([
  ...publicDesignFiles, 'index.js', 'package.json', 'tailwind.css',
  'studio/theme.css', 'studio/tokens.css', 'studio/palette-reset.css',
]);

export function resolveDesignSystemFile(pathname) {
  if (pathname === designSystemBase || pathname === `${designSystemBase}/`) return 'index.html';
  const prefix = [`${designSystemBase}/`, '/web/design-system/'].find(value => pathname.startsWith(value));
  if (!prefix) return undefined;
  const file = pathname.slice(prefix.length);
  return publicDesignFiles.includes(file) ? file : undefined;
}
