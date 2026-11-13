import { App } from '@modelcontextprotocol/ext-apps';

const app = new App({ name: 'OpenMotion video', version: '1.0.0' }, {});
document.documentElement.dataset.motionUi = '';
document.body.innerHTML = `<main><header><strong id="title">视频制作</strong><span id="version"></span></header><div class="screen"><video controls playsinline preload="metadata" hidden></video><div class="waiting"><span class="spinner"></span><p id="phase">正在读取状态…</p></div></div><footer><span id="status" role="status" aria-live="polite">正在连接</span><time></time><button id="retry" hidden>重新加载</button></footer></main>`;
const video = document.querySelector('video'), waiting = document.querySelector('.waiting');
const retry = document.querySelector('#retry'), status = document.querySelector('#status');
const labels = {
  authoring: '正在制作', saved: '内容已保存，正在准备预览', queued: '等待生成预览',
  checking: '正在检查工程', rendering: '正在生成预览', verifying: '正在检查视频', verified: '正在准备播放',
  completed: '本轮已完成 · 点击播放', failed: '本轮制作未完成', cancelling: '正在停止生成',
  cancelled: '本轮已取消', unconfirmed: '状态暂未确认', unavailable: '视频暂无法在此播放',
};
let projectId, workId, connected = false, fetchedVideo = false, timer, fetching = false, closed = false, terminal = false;
function show(result) {
  const work = result.structuredContent?.inlineWork;
  if (!work || (workId && work.id !== workId)) return;
  workId = work.id; projectId = work.projectId;
  document.querySelector('#title').textContent = work.title;
  document.querySelector('#version').textContent = `v${work.versionNumber}`;
  const phase = work.state === 'authoring' && work.mode === 'modify' ? '正在修改' : labels[work.state] || '状态暂未更新';
  document.querySelector('#phase').textContent = phase;
  status.textContent = work.error || phase;
  document.querySelector('time').textContent = new Date(work.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  terminal = ['failed', 'cancelled', 'unavailable'].includes(work.state);
  document.querySelector('.spinner').hidden = terminal || work.state === 'completed' || work.state === 'unconfirmed';
  const media = result._meta?.inlineVideo;
  if (media?.poster) waiting.style.backgroundImage = `url('${media.poster}')`;
  if (work.playable && media?.video && !fetchedVideo) {
    fetchedVideo = true; video.src = media.video;
    if (media.poster) video.poster = media.poster;
    video.hidden = false; waiting.hidden = true; video.load();
  }
  if (terminal) clearTimeout(timer);
}
async function refresh() {
  if (!connected || !workId || fetching || closed || document.hidden || fetchedVideo || terminal) return;
  fetching = true;
  try {
    const result = await app.callServerTool({ name: 'openmotion_get_project', arguments: { projectId, workId, includeVideo: !fetchedVideo } }, { timeout: 15000 });
    if (result.isError) throw new Error('状态读取失败');
    show(result); retry.hidden = true;
  } catch {
    status.textContent = '状态暂未更新'; retry.hidden = false;
    document.querySelector('#phase').textContent = '状态暂未更新';
    document.querySelector('.spinner').hidden = true;
  } finally {
    fetching = false;
    if (!closed && !document.hidden && !fetchedVideo && !terminal) timer = setTimeout(refresh, 2000);
  }
}
app.ontoolresult = result => {
  if (!result.structuredContent?.inlineWork && !workId) {
    // The existing open/review actions keep their semantics and do not create another video frame.
    document.querySelector('main').textContent = result.isError ? '预览请求未完成' : result.structuredContent?.review ? '审阅记录已保存' : '编辑器预览已准备，请使用返回的预览入口';
    return;
  }
  show(result); if (connected) { clearTimeout(timer); void refresh(); }
};
app.onteardown = async () => { closed = true; clearTimeout(timer); video.removeAttribute('src'); video.load(); return {}; };
document.addEventListener('visibilitychange', () => { clearTimeout(timer); if (!document.hidden) void refresh(); });
video.addEventListener('error', () => { status.textContent = '视频播放失败'; retry.hidden = false; });
retry.onclick = () => {
  fetchedVideo = false; terminal = false; video.hidden = true; waiting.hidden = false;
  video.removeAttribute('src'); video.load(); clearTimeout(timer); void refresh();
};
app.onhostcontextchanged = context => { if (context.theme) document.documentElement.dataset.theme = context.theme; };
await app.connect(); connected = true;
const theme = app.getHostContext()?.theme; if (theme) document.documentElement.dataset.theme = theme;
void refresh();
