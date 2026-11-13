import { defineConfig, mergeConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import viteConfig from './vite.config';

// Unit/DOM tests need the production aliases and defines, but not CSS generation
// or React Fast Refresh. Vite's automatic JSX transform still compiles the same JSX.
export default mergeConfig({ ...viteConfig, plugins: [] }, defineConfig({
  resolve: { alias: [{ find: /^@hyperframes\/studio$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) }] },
  esbuild: { jsx: 'automatic', define: { 'import.meta.hot': 'undefined' } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Real Chrome benches are retained separately; this command runs unit/DOM suites.
    exclude: ['src/**/*.browser.test.ts'],
    setupFiles: ['src/test-setup.ts'],
    maxWorkers: 4,
    pool: 'threads',
    // DOM environments own storage; Node 25+ otherwise shadows it with a server global.
    execArgv: ['--no-experimental-webstorage'],
    environmentOptions: {
      // Upstream edit tests populate about:blank composition documents themselves.
      happyDOM: { settings: { enableIframePageLoading: true } },
    },
  },
}));
