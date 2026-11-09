import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Context, configuration, guard } from "@";
import { style } from "@/rules/style.js";

const grants = [
  { module: "packages/theme", kind: "theme", entry: "src/index.less", prefix: "om" },
  { module: "packages/components", kind: "components", entry: "src/index.less", prefix: "om", theme: "packages/theme" },
];
function policy(styles: unknown) {
  return configuration({ schemaVersion: 1, guard: { styles } });
}
describe("explicit module style roles", () => {
  it("opens src Less only, without opening tests or script/HTML style escapes", () => {
    const context: Context = { root: "/unused", entries: [], modules: [], policy: policy(grants) };
    expect(style(context, "packages/components/src/button.less", ".om-button {} ")).toEqual([]);
    for (const [path, source] of [
      ["packages/components/tests/button.less", ".om-button {}"],
      ["packages/componentss/src/button.less", ".om-button {}"],
      ["apps/web/src/button.less", ".om-button {}"],
      ["packages/theme/src/index.css", ":root {}"],
      ["packages/components/src/button.ts", 'element.style.color="red";'],
      ["packages/theme/src/index.html", "<style>body {}</style>"],
    ])
      expect(style(context, path ?? "", source ?? "")[0]?.rule).toBe("file.style");
  });
  it.each([
    [{ ...grants[0], module: "packages/*" }],
    [grants[0], grants[0]],
    [{ ...grants[0], entry: "src/../index.less" }],
    [grants[1]],
    [{ ...grants[0], extra: true }],
  ])("rejects noncanonical/incomplete grants", (...styles) => {
    expect(() => policy(styles)).toThrow();
  });
  it.each([
    { rules: { "file.style": { enabled: false } } },
    { overrides: [{ paths: ["**"], rules: { "file.style": { enabled: false } } }] },
    { exceptions: [{ paths: ["**"], rules: ["file.style"], reason: "bypass" }] },
  ])("refuses general style disabling", (guard) => {
    expect(() => configuration({ schemaVersion: 1, guard })).toThrow();
  });
});

it("checks the complete authorized Less graph and rejects orphan and cross-module imports", async () => {
  const root = await mkdtemp(join(tmpdir(), "style-graph-"));
  try {
    await writeFile(join(root, "pnpm-workspace.yaml"), "packages: [packages/*]\n");
    await writeFile(join(root, "package.json"), '{"name":"fixture","private":true}');
    for (const name of ["theme", "components"]) {
      await mkdir(join(root, `packages/${name}/src`), { recursive: true });
      await writeFile(join(root, `packages/${name}/package.json`), JSON.stringify({ name: `@fixture/${name}` }));
    }
    await writeFile(
      join(root, "packages/theme/src/index.less"),
      ':root,[data-om-theme="light"]{--om-text:#494949}[data-om-theme="dark"]{--om-text:#ededed}',
    );
    const entry = join(root, "packages/components/src/index.less");
    await writeFile(entry, ".om-button { &__label { color:var(--om-text) } }");
    const check = async () =>
      (await guard({ root, policy: policy(grants) })).findings.filter((item) => item.rule === "file.style");
    expect(await check()).toEqual([]);
    const orphan = join(root, "packages/components/src/orphan.less");
    await writeFile(orphan, ".om-orphan { color:red }");
    expect(await check()).toContainEqual(expect.objectContaining({ message: expect.stringContaining("orphan Less") }));
    await rm(orphan);
    await writeFile(entry, '@import "../../theme/src/index.less";');
    expect(await check()).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("outside authorized") }),
    );
    await writeFile(entry, ".om-button { color:red }");
    expect(await check()).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("semantic tokens") }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
