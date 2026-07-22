import { homedir } from "node:os";
import path from "node:path";
import { invokeAgent } from "../agents/invoke";
import { loadSkill } from "../templates/loader";
import {
  PROJECT_GENERATION_DEADLINE_MS,
  ProjectError,
  type CreateProjectInput,
  type CreateProjectResult,
  type PatchProjectInput,
  type ProjectAsset,
  type ProjectSnapshot,
} from "./contracts";
import {
  generateAndStoreProject,
  type GenerateProjectDependencies,
} from "./generate";
import { createProjectStore } from "./storage";

export type ProjectService = {
  create(input: CreateProjectInput): Promise<CreateProjectResult>;
  get(id: string): Promise<ProjectSnapshot>;
  patch(id: string, patch: PatchProjectInput): Promise<ProjectSnapshot>;
  putAsset(
    id: string,
    originalName: string,
    bytes: Uint8Array,
  ): Promise<ProjectAsset>;
  getAsset(
    id: string,
    filename: string,
  ): Promise<{ asset: ProjectAsset; bytes: Uint8Array }>;
  unregister(id: string): Promise<void>;
};

export function createProjectService(
  deps: GenerateProjectDependencies,
): ProjectService {
  return {
    create: (input) => generateAndStoreProject(input, deps),
    get: (id) => deps.store.get(id),
    patch: (id, patch) => deps.store.patch(id, patch),
    putAsset: (id, originalName, bytes) =>
      deps.store.putAsset(id, originalName, bytes),
    getAsset: (id, filename) => deps.store.getAsset(id, filename),
    unregister: (id) => deps.store.unregister(id),
  };
}

let configuredService: ProjectService | undefined;

function getConfiguredService(): ProjectService {
  if (configuredService !== undefined) return configuredService;

  const publicBaseUrl = process.env.HTML_ANYTHING_PUBLIC_BASE_URL;
  if (publicBaseUrl === undefined || publicBaseUrl === "") {
    throw new ProjectError(
      "configuration_missing",
      "Public project base URL is not configured.",
    );
  }
  const configuredRegistryRoot =
    process.env.HTML_ANYTHING_PROJECT_REGISTRY_DIR;
  const managedRegistryBoundary = path.join(
    homedir(),
    ".local",
    "share",
    "html-anything",
  );
  const registryRoot =
    configuredRegistryRoot ??
    path.join(managedRegistryBoundary, "project-registry");
  const store = createProjectStore({
    registryRoot,
    ...(configuredRegistryRoot === undefined
      ? { managedRegistryBoundary }
      : {}),
    publicBaseUrl,
    now: () => new Date(),
  });
  configuredService = createProjectService({
    store,
    publicBaseUrl,
    loadSkill,
    invokeAgent,
    deadlineMs: PROJECT_GENERATION_DEADLINE_MS,
  });
  return configuredService;
}

export const projectService: ProjectService = {
  async create(input) {
    return getConfiguredService().create(input);
  },
  async get(id) {
    return getConfiguredService().get(id);
  },
  async patch(id, patch) {
    return getConfiguredService().patch(id, patch);
  },
  async putAsset(id, originalName, bytes) {
    return getConfiguredService().putAsset(id, originalName, bytes);
  },
  async getAsset(id, filename) {
    return getConfiguredService().getAsset(id, filename);
  },
  async unregister(id) {
    return getConfiguredService().unregister(id);
  },
};
