import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type PackageJson = {
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const root = process.cwd();
const failures: string[] = [];

function rel(p: string): string {
  return p.split(path.sep).join("/");
}

function hasPath(p: string): boolean {
  return existsSync(path.join(root, p));
}

function requirePath(p: string): void {
  if (!hasPath(p)) failures.push(`Missing required path: ${rel(p)}`);
}

function requireDir(p: string): void {
  const full = path.join(root, p);
  if (!existsSync(full)) {
    failures.push(`Missing required directory: ${rel(p)}`);
    return;
  }
  if (!statSync(full).isDirectory()) failures.push(`Expected directory: ${rel(p)}`);
}

function forbidPath(p: string, reason: string): void {
  if (hasPath(p)) failures.push(`Unexpected path: ${rel(p)} (${reason})`);
}

function requireText(p: string, needle: string): void {
  const full = path.join(root, p);
  if (!existsSync(full)) {
    failures.push(`Cannot inspect missing file: ${rel(p)}`);
    return;
  }
  const text = readFileSync(full, "utf8");
  if (!text.includes(needle)) {
    failures.push(`Expected ${rel(p)} to contain ${JSON.stringify(needle)}`);
  }
}

function readJson<T>(p: string): T | undefined {
  const full = path.join(root, p);
  if (!existsSync(full)) {
    failures.push(`Cannot inspect missing file: ${rel(p)}`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(full, "utf8")) as T;
  } catch (err) {
    failures.push(`Invalid JSON in ${rel(p)}: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

const rootPkg = readJson<PackageJson>("package.json");
const nextPkg = readJson<PackageJson>("next/package.json");
const e2ePkg = readJson<PackageJson>("e2e/package.json");

requirePath(".github/workflows/ci.yml");
requirePath(".gitignore");
requirePath("package.json");
requirePath("next/package.json");
requirePath("e2e/package.json");
requirePath("pnpm-lock.yaml");
requirePath("pnpm-workspace.yaml");
requirePath("next/tsconfig.json");
requirePath("next/next.config.ts");
requirePath("next/postcss.config.mjs");
requirePath("next/vitest.config.ts");
requirePath("e2e/playwright.config.ts");
requirePath("e2e/tsconfig.json");
requirePath("e2e/AGENTS.md");

requireDir("next");
requireDir("next/src");
requireDir("next/src/app");
requirePath("next/src/app/layout.tsx");
requirePath("next/src/app/page.tsx");
requireDir("next/src/app/api");
requireDir("next/src/components");
requireDir("next/src/lib");
requireDir("next/public");
requireDir("e2e");
requireDir("e2e/ui");
requirePath("e2e/ui/export-menu.test.ts");
requireDir("e2e/scripts");
requirePath("e2e/scripts/playwright.ts");
requireDir("scripts");
requirePath("scripts/guard.ts");

forbidPath("app", "the complete Next app lives under next/");
forbidPath("src", "Next app source lives under next/src/");
forbidPath("tests/ui", "browser tests live under top-level e2e/");
forbidPath("playwright.config.ts", "Playwright configuration is owned by e2e/");
forbidPath("e2e/export-menu.spec.ts", "Playwright UI cases live under e2e/ui/");
forbidPath("next/e2e", "browser tests live under top-level e2e/");
forbidPath("next/tests", "browser tests live under top-level e2e/");

if (rootPkg) {
  if (!rootPkg.packageManager?.startsWith("pnpm@")) {
    failures.push("root package.json must pin packageManager to pnpm");
  }

  const scriptNames = Object.keys(rootPkg.scripts ?? {});
  if (scriptNames.length > 0) {
    failures.push(`root package.json must not define scripts; use pnpm -F package filters (${scriptNames.join(", ")})`);
  }

  const rootDeps = Object.keys(rootPkg.dependencies ?? {});
  if (rootDeps.length > 0) {
    failures.push(`root package.json must not declare runtime dependencies (${rootDeps.join(", ")})`);
  }

  const rootDevDeps = rootPkg.devDependencies ?? {};
  for (const dep of Object.keys(rootDevDeps)) {
    if (dep !== "tsx") failures.push(`root package.json devDependency ${dep} belongs in a workspace package`);
  }
  if (!rootDevDeps.tsx) {
    failures.push("root package.json must declare tsx for scripts/guard.ts");
  }
}

if (nextPkg) {
  const scripts = nextPkg.scripts ?? {};
  const requiredScripts: Record<string, string> = {
    dev: "next",
    build: "next build",
    start: "next start",
    typecheck: "tsc --noEmit",
    test: "vitest run",
    "test:watch": "vitest",
  };

  for (const [name, expected] of Object.entries(requiredScripts)) {
    if (scripts[name] !== expected) {
      failures.push(`next/package.json script ${name} must be ${JSON.stringify(expected)}`);
    }
  }

  const deps = { ...(nextPkg.dependencies ?? {}), ...(nextPkg.devDependencies ?? {}) };
  for (const dep of ["happy-dom", "next", "react", "react-dom", "typescript", "vitest"]) {
    if (!deps[dep]) failures.push(`next/package.json must declare ${dep}`);
  }
}

if (e2ePkg) {
  const scripts = e2ePkg.scripts ?? {};
  const requiredScripts: Record<string, string> = {
    test: "playwright test -c playwright.config.ts",
    typecheck: "tsc -p tsconfig.json --noEmit",
    "playwright:clean": "tsx scripts/playwright.ts clean",
  };

  for (const [name, expected] of Object.entries(requiredScripts)) {
    if (scripts[name] !== expected) {
      failures.push(`e2e/package.json script ${name} must be ${JSON.stringify(expected)}`);
    }
  }

  const deps = { ...(e2ePkg.dependencies ?? {}), ...(e2ePkg.devDependencies ?? {}) };
  for (const dep of ["@playwright/test", "@types/node", "jszip", "tsx", "typescript"]) {
    if (!deps[dep]) failures.push(`e2e/package.json must declare ${dep}`);
  }
}

requireText("e2e/playwright.config.ts", 'testDir: "./ui"');
requireText("e2e/playwright.config.ts", "pnpm -F @html-anything/next build");
requireText("e2e/tsconfig.json", '"ui/**/*.ts"');
requireText("e2e/AGENTS.md", "Do not add Playwright cases under `next/`");
requireText("pnpm-workspace.yaml", "  - e2e");
requireText("pnpm-workspace.yaml", "  - next");
requireText(".gitignore", "/e2e/ui/reports/");
requireText(".gitignore", "/e2e/node_modules");
requireText(".gitignore", "/next/node_modules");
requireText(".gitignore", "/next/.next/");
requireText("next/vitest.config.ts", 'environment: "happy-dom"');
requireText(".github/workflows/ci.yml", "pull_request");
requireText(".github/workflows/ci.yml", "pnpm install --frozen-lockfile");
requireText(".github/workflows/ci.yml", "pnpm exec tsx scripts/guard.ts");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/next typecheck");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/e2e typecheck");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/next test");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/next build");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/e2e exec playwright install --with-deps chromium");
requireText(".github/workflows/ci.yml", "pnpm -F @html-anything/e2e test");

if (failures.length) {
  console.error("Guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Guard passed.");
