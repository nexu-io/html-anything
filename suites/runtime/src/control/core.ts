import { randomUUID } from "node:crypto";
import { Library, type LibraryOptions } from "@odsuite/blob";
import { type Digest, type Generation, gates } from "@odsuite/protocol";
import { type Manifest, protocolIdentity } from "@odsuite/release";
import {
  type Attachment,
  type Directory,
  type Expose,
  type Factory,
  type FactoryScope,
  managerReady,
  type Service,
} from "@odsuite/sidecar";
import { Agent } from "../agent.js";
import type { Attempt, Generations, Mount } from "../generations.js";
import { type CapsuleEnvironment, type Composition, Product, type ProductReceipt } from "../lifecycle.js";
import { Documents } from "./documents.js";
import { unitFile } from "./units.js";
export function ownerAdapter(
  onQuit?: () => void,
  initialize?: (context: import("@odsuite/sidecar").Context) => Promise<void>,
) {
  let trigger: () => void = () => {},
    active = true;
  const signal = new Promise<void>((done) => (trigger = done));
  return {
    handlers: {
      quit: () => {
        if (!onQuit) throw Error("host quit adapter unavailable");
        trigger();
        return true;
      },
    },
    lifecycle: {
      initialize: async (context: import("@odsuite/sidecar").Context) => {
        await initialize?.(context);
        context.background(() => {
          void signal
            .then(() => {
              if (active) onQuit?.();
            })
            .catch((error) => process.stderr.write(String(error)));
        });
      },
      stop: async () => {
        active = false;
        trigger();
      },
    },
  };
}
export interface ActivationCheckpoint {
  stage: "prepared" | "capsule-stopped" | "daemon-stopped" | "ready" | "committed";
  target: Digest;
  nonce: string;
  previous: Digest;
}
export interface SessionOptions {
  onQuit?: () => void;
  /** Diagnostic observation only; never substitutes for runtime readiness. */
  onActivation?: (checkpoint: Readonly<ActivationCheckpoint>) => Promise<void>;
  blobRetentionMs?: number;
  /** Diagnostic fault observation only; cannot provide readiness or GC policy. */
  onContentCheckpoint?: LibraryOptions["onCheckpoint"];
  carrier: number;
  candidate?: string;
  executable: string;
  manifest: Manifest;
  namespace: string;
  recover?: boolean;
  root: string;
  seed: string;
}
export interface Renderer {
  reload(): Promise<string>;
  probe(): Promise<string>;
}
export interface CapsuleRenderer extends Renderer {
  compose(composition: Composition): Promise<void>;
}
export interface Receipt {
  factory: Readonly<FactoryScope>;
  directory: Directory;
  capsule: string;
  product?: ProductReceipt;
  daemon: Record<string, unknown>;
  generation: Digest;
  nonce: string;
  pid: number;
  renderer: string;
  schema: 1;
  anchor: Digest;
  phase: string;
  error?: string;
  candidate?: Digest;
  units: {
    web: { digest?: Digest; version?: string; generation: Digest; nonce: string };
    daemon: { digest?: Digest; version?: string; nonce?: string; pid?: number; phase?: string };
  };
  counts: { daemon: number; document: number };
}
export class Core {
  private libraries = new Set<Library>();
  protected documentsController: Documents;
  async blobLibrary(
    context: import("@odsuite/sidecar").Context,
    options: Omit<LibraryOptions, "factory" | "context"> = {},
  ) {
    if (this.closed || this.closing || this.blocked) throw Error("runtime is not accepting a blob controller");
    const library = await Library.open({ ...options, factory: this.factory, context });
    this.libraries.add(library);
    return library;
  }
  protected async drainLibraries() {
    await Promise.all([...this.libraries].map((library) => library.close()));
    this.libraries.clear();
  }
  protected attempt?: Attempt;
  protected agent?: Agent;
  protected closed = false;
  protected blocked = false;
  protected closing?: Promise<{ status: string; survivors: number[] }>;
  protected ready = false;
  protected payload?: Composition;
  protected product?: Product;
  protected activation?: Promise<Composition>;
  protected electron?: Attachment;
  protected witness = "";
  protected current: Mount;
  protected view: Mount;
  protected viewGeneration?: Generation;
  readonly anchor: Digest;
  protected docGeneration: Digest;
  protected docNonce: string;
  protected documentFenced = false;
  protected documents = 0;
  protected starts = 0;
  protected webVersion?: string;
  protected phase = "starting";
  protected error?: string;
  protected target?: Digest;
  protected switching = false;
  protected handoff?: Promise<Receipt>;
  protected environment: CapsuleEnvironment = {};
  private booting?: Promise<import("@odsuite/sidecar").Context>;
  bootstrap() {
    if (this.electron) return Promise.resolve(this.electron.context);
    this.booting ??= (async () => {
      this.electron = await this.host.factory(this.factory.scope).expose<{ quit: { input: null; output: boolean } }>({
        identity: { service: "electron", generation: this.anchor },
        ...ownerAdapter(this.options.onQuit),
      });
      return this.electron.context;
    })();
    return this.booting;
  }
  announce() {
    return managerReady(this.host, this.options.root, this.factory.scope);
  }
  get mount() {
    return this.view;
  }
  protected constructor(
    readonly options: SessionOptions,
    protected host: Service,
    protected factory: Factory,
    protected generations: Generations,
    mount: Mount,
    readonly manifest: Manifest,
    readonly nonce: string,
  ) {
    this.documentsController = new Documents(generations.resources, () => {
      const context = this.electron!.context;
      return { ...context.identity, incarnation: context.incarnation };
    });
    this.current = mount;
    this.view = mount;
    this.anchor = mount.target;
    this.docGeneration = mount.target;
    this.docNonce = nonce;
  }
  blobStatus() {
    return this.generations.resources.library.status();
  }
  collectBlobs() {
    return this.generations.resources.library.collect();
  }
  cachedContent(artifact: import("@odsuite/protocol").Artifact) {
    return this.generations.resources.cached(artifact);
  }
  cacheContent(name: string, release: import("@odsuite/publish").Release) {
    if (!/^observer:(updates|bootstrapupdates):[a-f0-9-]{36}$/.test(name)) throw Error("invalid observer reference");
    return this.generations.cache(name, release);
  }
  cachedRelease(value: import("@odsuite/protocol").Envelope) {
    return this.generations.resources.bytes(value).then((assets) => ({ envelope: value, assets }));
  }
  releaseContent(name: string) {
    return this.generations.resources.library.session((library) => library.unretain("prepared", name));
  }
  get currentTarget() {
    return this.current.target;
  }
  content() {
    if (this.closed || this.closing) throw new Error("session is closed");
    return this.generations.content(this.current.target);
  }
  async expose<M>(service: string, options: Omit<Expose<M>, "identity">) {
    if (this.closed || this.closing) throw new Error("session is closed");
    return this.host
      .factory(this.factory.scope)
      .expose<M>({ ...options, identity: { service, generation: this.anchor } });
  }
  acceptDocument(nonce: unknown) {
    return !this.closed && !this.closing && !this.blocked && !this.documentFenced && nonce === this.docNonce;
  }
  async documentStart(stop: () => Promise<void>) {
    if (this.closed || this.closing || this.blocked) throw Error("runtime is not accepting a document");
    this.documentFenced = true;
    const nonce = this.documents === 0 ? this.nonce : randomUUID(),
      target = this.view.target;
    await this.documentsController.open(target, nonce, stop);
    this.docGeneration = target;
    this.docNonce = nonce;
    this.documents++;
    this.witness = "";
    this.documentFenced = false;
  }
  documentReady() {
    return this.documentsController.ready(this.docNonce);
  }
  webAsset<T>(operation: (root: string) => Promise<T>) {
    if (!this.acceptDocument(this.docNonce)) return Promise.reject(Error("document is fenced"));
    const path = this.view.web;
    return this.documentsController.read(this.docNonce, () => operation(path));
  }
  browser() {
    return {
      origin: protocolIdentity(this.manifest).origin,
      external: protocolIdentity(this.manifest).external,
      generation: this.docGeneration,
      nonce: this.docNonce,
      version: this.product?.snapshot().version ?? this.manifest.identity.version,
      web: { unit: this.viewGeneration?.web.digest, version: this.webVersion },
      daemon: {
        generation: this.agent?.generation,
        nonce: this.agent?.nonce,
        unit: this.agent?.unit,
        version: this.agent?.version,
      },
    };
  }
  documentNonce() {
    return this.docNonce;
  }
  webURL() {
    if (!this.viewGeneration) throw new Error("web content is not mounted");
    return `${protocolIdentity(this.manifest).origin}/_web/${this.viewGeneration.web.digest.slice(7)}/`;
  }
  activate(environment: CapsuleEnvironment = {}): Promise<Composition> {
    if (this.closed || this.closing || this.activation)
      return Promise.reject(new Error("capsule is closed or already initialized"));
    this.environment = environment;
    this.activation = this.initializeProduct(environment).catch((fault) => {
      this.phase = "failed";
      this.error = String(fault);
      throw fault;
    });
    return this.activation;
  }
  protected async initializeProduct(_environment: CapsuleEnvironment): Promise<Composition> {
    const generation = (await this.content()).envelope.generation.capsule.digest;
    if (this.closed || this.closing) throw new Error("session is closed");
    await this.bootstrap();
    this.product = this.makeProduct(this.mount, generation, this.manifest.identity.version);
    try {
      this.payload = await this.product.initialize();
    } catch (error) {
      try {
        await this.product.close();
      } catch (cleanup) {
        throw new AggregateError([error, cleanup], "adapter initialization and cleanup failed");
      }
      throw error;
    }
    return this.payload;
  }

  protected makeProduct(mount: Mount, artifact: Digest, version: string) {
    if (!this.electron) throw Error("Electron resource owner is not ready");
    return new Product(
      this.electron.context,
      mount,
      randomUUID(),
      artifact,
      { request: (operation, value) => this.request(operation, value) },
      this.environment,
      protocolIdentity(this.manifest),
      version,
      this.generations.resources,
    );
  }
  async start(): Promise<void> {
    if (this.closed || this.closing || this.agent) throw new Error("session is closed or already started");
    this.product?.assertReady();
    if (!this.product) throw new Error("capsule is not initialized");
    await this.factory.session(async () => {
      this.viewGeneration = (await this.content()).envelope.generation;
      this.webVersion = (await unitFile(this.view.web, "web"))?.version;
      const web = await unitFile(this.view.web, "web"),
        daemon = await unitFile(this.view.daemon, "daemon");
      if (!!web !== !!daemon || (web && daemon && web.api !== daemon.api))
        throw new Error("incompatible initial unit contracts");
      await this.launch(this.current, this.viewGeneration, this.nonce);
    });
  }
  protected async launch(mount: Mount, generation: Generation, nonce?: string) {
    this.agent = await Agent.start(
      this.factory,
      mount,
      generation.daemon.digest,
      this.options.executable,
      protocolIdentity(this.manifest).origin,
      this.generations.resources,
      nonce,
    );
    this.starts++;
  }
  async call(method: string, input: unknown): Promise<unknown> {
    if (this.closed || this.closing || this.blocked || !this.product)
      return Promise.reject(new Error("session is closed or not initialized"));
    return this.product.call(method, input);
  }
  async request(operation: "health" | "read" | "write", value?: unknown) {
    if (this.closed || !this.agent) throw new Error("session is closed or not started");
    return this.agent.request(operation, value);
  }
  async confirm(payload: Composition, renderer: string): Promise<Receipt> {
    return this.factory.session(async () => {
      this.product?.assertReady();
      if (!this.product || payload !== this.payload) throw new Error("capsule composition mismatch");
      if (!renderer || !this.agent) throw new Error("runtime evidence missing");
      this.agent.exact(await this.agent.request("health"));
      this.payload = payload;
      this.witness = renderer;
      if (this.attempt) {
        for (const gate of gates) this.attempt = await this.generations.ready(this.attempt, gate);
        await this.generations.commit(this.attempt);
        this.attempt = undefined;
      }
      this.ready = true;
      this.phase = "ready";
      await this.product.ready();
      return this.snapshot();
    });
  }
  async snapshot(): Promise<Receipt> {
    let daemon: Record<string, unknown> = {
      pid: this.agent?.pid,
      generation: this.agent?.generation,
      nonce: this.agent?.nonce,
      phase: this.agent?.phase,
    };
    if (this.agent?.phase === "ready") {
      try {
        daemon = await this.agent.request("health");
      } catch (error) {
        daemon.error = String(error);
      }
    }
    const web = await unitFile(this.view.web, "web");
    return {
      schema: 1,
      factory: this.factory.scope,
      directory: await this.factory.directory(),
      generation: this.current.target,
      nonce: this.nonce,
      anchor: this.anchor,
      phase: this.phase,
      error: this.error,
      candidate: this.target,
      capsule: this.payload?.witness ?? "",
      product: this.product?.snapshot(),
      daemon,
      renderer: this.witness,
      pid: process.pid,
      units: {
        web: {
          digest: this.viewGeneration?.web.digest,
          version: web?.version,
          generation: this.docGeneration,
          nonce: this.docNonce,
        },
        daemon: {
          digest: this.agent?.unit,
          version: this.agent?.version,
          nonce: this.agent?.nonce,
          pid: this.agent?.pid,
          phase: this.agent?.phase,
        },
      },
      counts: { daemon: this.starts, document: this.documents },
    };
  }
}
