export interface Finding {
  path: string;
  rule: string;
  message: string;
  line?: number;
  column?: number;
}

export interface Rule {
  enabled: boolean;
  max?: number;
}

export interface Override {
  paths: string[];
  rules: Record<string, Partial<Rule>>;
}

export interface Exception {
  paths: string[];
  rules: string[];
  reason: string;
}

export interface StyleGrant {
  module: string;
  kind: "theme" | "components";
  entry: string;
  prefix: string;
  theme?: string;
  fonts?: string;
}

export interface Policy {
  styles: StyleGrant[];
  workspace: boolean;
  directories: { repository: string[]; module: string[] };
  exclude: string[];
  modules: string[];
  components: string[];
  names: string[];
  rules: Record<string, Rule>;
  overrides: Override[];
  exceptions: Exception[];
}

export interface Entry {
  path: string;
  kind: "directory" | "file" | "link";
}

export interface Module {
  path: string;
  name: string;
  manifest: Record<string, unknown>;
  aggregate?: boolean;
}

export interface Context {
  root: string;
  entries: Entry[];
  modules: Module[];
  policy: Policy;
}

export interface Report {
  schemaVersion: 1;
  root: string;
  mode: "full";
  ok: boolean;
  paths: number;
  files: number;
  links: string[];
  excluded: string[];
  pruned: string[];
  directories: Policy["directories"];
  exceptions: Exception[];
  findings: Finding[];
}
