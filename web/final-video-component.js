import { normalizeInlineResult } from '../shared/inline-video-result.js';

/** Only the final-video Tool mounts this surface; production calls never do. */
export function mountFinalVideo(root, app) {
  const document = root.ownerDocument;
  root.innerHTML = '<header><strong class="title">最终视频</strong><span class="duration"></span></header><div class="screen" hidden><video controls playsinline preload="metadata"></video></div><footer><span class="status" role="status" aria-live="polite">正在加载成片…</span><button class="retry" hidden>重新加载</button></footer>';
  const video = root.querySelector('video'), screen = root.querySelector('.screen');
  const status = root.querySelector('.status'), retry = root.querySelector('.retry');
  let identity, work, closed = false, loading = false, validSource = false, url;
  const error = message => { validSource = false; status.textContent = message; retry.hidden = !work; screen.hidden = true; };
  function update(input) {
    if (closed) return;
    try {
      const result = normalizeInlineResult(input), next = result.structuredContent.inlineWork;
      if (result.isError || !next || next.state !== 'completed' || !next.playable || !next.jobId || !next.sha256)
        throw new Error('成片尚不可播放，请等待导出完成。');
      const key = JSON.stringify([next.projectId, next.id, next.versionId, next.jobId, next.sha256]);
      if (identity && identity !== key) throw new Error('返回的视频版本不匹配，请重新打开该成片。');
      identity = key; work = next;
      root.querySelector('.title').textContent = next.title;
      const media = result._meta?.inlineVideo;
      if (!media?.video) throw new Error('未收到成片文件，请重新加载。');
      if (url) URL.revokeObjectURL(url);
      const bytes = Uint8Array.from(atob(media.video.split(',')[1]), c => c.charCodeAt(0));
      url = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
      screen.hidden = true; retry.hidden = true; status.textContent = '正在加载成片…';
      video.src = url;
      if (media.poster) video.poster = media.poster;
      validSource = true; video.load();
    } catch (reason) { error(reason.message.startsWith('INLINE_RESULT_INVALID:') ? '成片返回格式异常，请重新加载。' : reason.message); }
  }
  async function refresh() {
    if (!work || closed || loading) return;
    loading = true;
    try { update(await app.callServerTool({ name: 'openmotion_get_project', arguments: { projectId: work.projectId, workId: work.id, includeVideo: true } }, { timeout: 15000 })); }
    catch { error('成片读取失败，请重新加载。'); }
    finally { loading = false; }
  }
  const loaded = () => {
    if (closed || !validSource || !Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) return;
    screen.hidden = false; status.textContent = '成片可播放'; retry.hidden = true;
    const seconds = Math.round(video.duration);
    root.querySelector('.duration').textContent = `片长 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const failed = () => error('视频播放失败，请重新加载。');
  const visibility = () => { if (document.hidden) video.pause(); };
  video.addEventListener('loadeddata', loaded); video.addEventListener('error', failed);
  document.addEventListener('visibilitychange', visibility); retry.onclick = refresh;
  return { update, destroy() { closed = true; video.pause(); video.removeAttribute('src'); video.load();
    if (url) URL.revokeObjectURL(url); document.removeEventListener('visibilitychange', visibility); } };
}
