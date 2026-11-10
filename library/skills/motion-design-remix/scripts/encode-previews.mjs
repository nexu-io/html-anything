import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const [capturePath, outputPath] = process.argv.slice(2);
assert(capturePath && outputPath, 'Usage: node scripts/encode-previews.mjs <capture-root> <new-output-dir>');
const capture = path.resolve(capturePath), output = path.resolve(outputPath);
const report = JSON.parse(await readFile(path.join(capture, 'render-report.json'), 'utf8'));
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output);
function ffmpeg(args) {
  const p = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', ...args], { encoding: 'utf8' });
  if (p.error) throw p.error;
  assert.equal(p.status, 0, p.stderr);
}
const encoded = [];
for (const ref of report.filter(row => row.variant === 'reference')) {
  const remix = report.find(row => row.id === ref.id && row.variant === 'remix');
  assert(remix && ref.start === remix.start && ref.duration === remix.duration && ref.frames === remix.frames, 'Pairs must share source times and frame counts');
  assert.equal(ref.frames, Math.round(ref.duration * 12), 'Encode full frame captures, not still checks');
  assert.equal(ref.errors.length + remix.errors.length, 0, 'Fix capture errors first');
  const frames = variant => path.join(capture, 'frames', ref.id, variant, '%04d.png');
  const mp4 = path.join(output, ref.id + '.mp4');
  ffmpeg(['-framerate', '12', '-i', frames('reference'), '-framerate', '12', '-i', frames('remix'), '-filter_complex', '[0:v][1:v]hstack=inputs=2,scale=1280:360:flags=lanczos', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  ffmpeg(['-i', mp4, '-filter_complex', 'fps=12,scale=960:270:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', path.join(output, ref.id + '.gif')]);
  ffmpeg(['-ss', String(ref.duration / 2), '-i', mp4, '-frames:v', '1', '-q:v', '2', path.join(output, ref.id + '.jpg')]);
  const files = [];
  for (const extension of ['mp4', 'gif', 'jpg']) {
    const file = ref.id + '.' + extension, bytes = await readFile(path.join(output, file));
    files.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  encoded.push({ id: ref.id, startSeconds: ref.start, durationSeconds: ref.duration, framesPerSide: ref.frames, fps: 12, audio: false, files });
  console.log(ref.id, files.map(f => `${f.file}: ${f.bytes}`).join(', '));
}
await writeFile(path.join(output, 'encoding.json'), JSON.stringify(encoded, null, 2) + '\n');
