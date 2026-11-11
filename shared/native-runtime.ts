export type NativeStage = 'idle' | 'waiting' | 'downloading' | 'verifying' | 'extracting' | 'checking' | 'ready' | 'failed';
export type NativeComponent = { id: 'browser' | 'media' | 'ffmpeg' | 'ffprobe'; stage: NativeStage; receivedBytes?: number; totalBytes?: number; errorCode?: string; error?: string };
export type NativeRuntimeStatus = { managed: boolean; components: NativeComponent[]; capabilities: { capture: boolean; media: boolean; export: boolean } };

export function parseNativeRuntimeStatus(value: unknown): NativeRuntimeStatus | null {
  const status = value as NativeRuntimeStatus | null;
  if (!status || typeof status.managed !== 'boolean' || !Array.isArray(status.components) || !status.capabilities
    || !['capture', 'media', 'export'].every(key => typeof (status.capabilities as any)[key] === 'boolean')
    || !status.components.every(component => component && ['browser', 'media', 'ffmpeg', 'ffprobe'].includes(component.id)
      && ['idle', 'waiting', 'downloading', 'verifying', 'extracting', 'checking', 'ready', 'failed'].includes(component.stage)
      && [component.receivedBytes, component.totalBytes].every(bytes => bytes === undefined || Number.isFinite(bytes) && bytes >= 0)
      && (component.error === undefined || typeof component.error === 'string'))) return null;
  return status;
}

export function nativeRouteCapability(method: string, pathname: string): 'capture' | 'media' | 'export' | undefined {
  if (method === 'POST' && /^\/api\/projects\/[^/]+\/render$/.test(pathname)) return 'export';
  if (method === 'GET' && /^\/api\/projects\/[^/]+\/thumbnail\//.test(pathname)) return 'capture';
  if (/^\/api\/projects\/[^/]+\/(?:upload|waveform\/|peaks\/|media\/|loudness\/normalize|file-mutations\/freeze-frame)/.test(pathname)) return 'media';
}
