// Browser-safe contracts: this module has no runtime Node imports.
export interface Bootstrap {
  origin: string;
  external: string;
  generation: string;
  nonce: string;
  version: string;
  daemon?: { generation?: string; nonce?: string; unit?: string; version?: string };
  web?: { unit?: string; version?: string };
}
export interface Bridge {
  bootstrap: Bootstrap;
  call(method: string, input: unknown): Promise<unknown>;
  health(): Promise<Record<string, unknown>>;
  read(): Promise<Record<string, unknown>>;
  write(value: Record<string, unknown>): Promise<Record<string, unknown>>;
}
