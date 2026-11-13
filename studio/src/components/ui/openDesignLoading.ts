/*!
 * Copyright 2026 Open Design contributors. SPDX-License-Identifier: Apache-2.0
 * Adapted from nexu-io/open-design, apps/desktop/src/main/splash-pixel-scan.ts
 * at bc06128813c99fa63f5af53ad2c903c27db057f2. Shaders and sweep timing are unchanged;
 * this adapter adds per-instance cleanup, reduced motion and a visible static fallback.
 */
import wordmarkUrl from "./opendesign-wordmark.svg";

const PIXEL_SCAN_VERTEX_SHADER = `
precision highp float;
attribute vec3 position;
void main() { gl_Position = vec4(position, 1.0); }
`;

const PIXEL_SCAN_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float enterTime;
uniform float leaveTime;

uniform int mode;
uniform float speed;
uniform float delay;
uniform float width;
uniform vec3 accent;
uniform vec3 accent2;
uniform vec3 baseCol;
uniform vec2 mouse;
uniform float hover;
uniform float spot;

#define TRAIL 24
uniform vec2 trail[TRAIL];
uniform float trailW[TRAIL];

#define W width
#define LAYERS 3.0

vec4 readTex(vec2 uv) {
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return vec4(0);
  return texture2D(src, uv);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(4859., 3985.))) * 3984.); }
float sdBox(vec2 p, float r) { vec2 q = abs(p) - r; return min(length(q), max(q.y, q.x)); }

float dir = 1.;
vec2 mp = vec2(0.);
vec2 tp[TRAIL];

vec2 pxToP(vec2 px) {
  vec2 uv = (px - offset) / resolution;
  vec2 q = uv * 2. - 1.;
  q.y *= resolution.y / resolution.x;
  return q;
}

float toRangeT(vec2 p, float scale) {
  float d;
  if (mode == 0) d = p.x / (scale * 2.) + .5;
  else if (mode == 1) d = 1. - (p.y / (scale * 2.) + .5);
  else if (mode == 2) d = length(p) / scale;

  else d = dot(p, vec2(0.7071, 0.7071)) / (scale * 2.) + .5;
  d = dir > 0. ? d : (1. - d);
  return d;
}

vec4 cell(vec2 p, vec2 pi, float scale, float t, float edge) {
  vec2 pc = pi + .5;

  vec2 uvc = pc / scale;
  uvc.y /= resolution.y / resolution.x;
  uvc = uvc * 0.5 + 0.5;
  if (uvc.x < 0. || uvc.x > 1. || uvc.y < 0. || uvc.y > 1.) return vec4(0);
  float alpha = smoothstep(.0, .1, texture2D(src, uvc).a);

  float x = toRangeT(pi, scale);
  float n = hash(pi);
  float SPREAD = W * 2.2;
  float anim = smoothstep(W * 2., .0, abs(x + n * SPREAD - t));

  vec2 cellP = pc / scale;
  float spotA = 0.;
  for (int i = 0; i < TRAIL; i++) {
    float w = trailW[i];
    if (w <= 0.) continue;
    vec2 rel = cellP - tp[i];
    float ang = atan(rel.y, rel.x);
    float wob = 1.
      + 0.30 * sin(3. * ang + time * 1.6)
      + 0.16 * sin(5. * ang - time * 1.1 + 1.3);
    float reach = spot * 0.8 * wob;
    spotA = max(spotA, smoothstep(reach, reach * 0.4, length(rel)) * w);
  }
  anim = max(anim, spotA * hover);

  float tone = 0.5 + 0.5 * sin(time * 2.0 + n * 6.2831)
                   + 0.18 * sin(time * 3.7 + n * 12.566);
  tone = clamp(tone, 0., 1.);
  vec3 cellAccent = mix(accent, accent2, tone);
  vec4 color = vec4(mix(baseCol, cellAccent, anim), 1.) * anim;

  float pull = hover * smoothstep(spot * 1.4, 0., length(cellP - mp));
  vec2 mag = normalize(mp - cellP + 1e-5) * pull * 0.18;
  vec2 bp = p - pc - mag;

  float sd = sdBox(bp, .38);
  color *= mix(1., clamp(.3 / abs(sd), 0., 10.), edge * pow(anim, 9.));
  color += vec4(cellAccent, 1.) * anim * smoothstep(.55, .0, abs(sd)) * 0.07;

  return color * alpha;
}

vec4 cellsColor(vec2 p, float scale, float t) {
  vec2 pi = floor(p);
  vec2 d = vec2(0, 1);
  vec4 cc = vec4(0);
  cc += cell(p, pi, scale, t, .2) * 4.;
  cc += cell(p, pi + d.xy, scale, t, .9);
  cc += cell(p, pi - d.xy, scale, t, .9);
  cc += cell(p, pi + d.yx, scale, t, .9);
  cc += cell(p, pi - d.yx, scale, t, .9);
  return cc / 8.;
}

vec4 draw(vec2 uv, vec2 p, float t, float scale) {
  vec4 c = readTex(uv);
  vec2 pi = floor(p * scale);
  float n = hash(pi);
  t = t * (1. + W * 4.) - W * 2.;
  float x = toRangeT(pi, scale);
  float a1 = smoothstep(t, t - W, x + n * W);
  c *= a1;
  c += cellsColor(p * scale, scale, t) * 1.1;
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 p = uv * 2. - 1.;
  p.y *= resolution.y / resolution.x;

  mp = pxToP(mouse);
  for (int i = 0; i < TRAIL; i++) tp[i] = pxToP(trail[i]);

  float t;
  if (leaveTime > 0.) { dir = -1.; t = clamp(leaveTime * speed, 0., 1.); }
  else { t = clamp((enterTime - delay) * speed, 0., 1.); }
  t = (fract(t * .99999) - 0.5) * dir + 0.5;

  for (float i = 0.; i < LAYERS; i++) {
    float s = cos(i) * 11. + 32.;
    gl_FragColor += draw(uv, p, t, abs(s));
  }
  gl_FragColor /= LAYERS;
  gl_FragColor *= smoothstep(0., 0.01, t);
}
`;

/** Mount one independent copy of the desktop splash, with a static image underneath. */
export function mountOpenDesignLoading(host: HTMLElement): () => void {
  const image = document.createElement("img");
  image.alt = "";
  image.draggable = false;
  image.src = wordmarkUrl;
  const canvas = document.createElement("canvas");
  for (const element of [image, canvas]) {
    Object.assign(element.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" });
  }
  host.dataset.opendesignLoading = "";
  host.style.position = "relative";
  host.replaceChildren(image, canvas);
  canvas.hidden = true;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let gl: WebGLRenderingContext | null = null;
  let raf = 0;
  let disposed = false;
  let resizeObserver: ResizeObserver | undefined;
  let releaseGpu = () => {};

  const stop = () => {
    cancelAnimationFrame(raf);
    resizeObserver?.disconnect();
    releaseGpu();
    releaseGpu = () => {};
    canvas.hidden = true;
    image.hidden = false;
  };
  const start = () => {
    stop();
    if (disposed || motion.matches || !image.complete || !image.naturalWidth) return;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: true }); }
    catch { return; }
    if (!gl) return;
    const gpu = gl;
    const shaders: WebGLShader[] = [];
    const program = gpu.createProgram();
    const buffer = gpu.createBuffer();
    const texture = gpu.createTexture();
    releaseGpu = () => {
      shaders.forEach(shader => gpu.deleteShader(shader));
      gpu.deleteProgram(program);
      gpu.deleteBuffer(buffer);
      gpu.deleteTexture(texture);
    };
    if (!program || !buffer || !texture) { stop(); return; }
    for (const [type, source] of [[gpu.VERTEX_SHADER, PIXEL_SCAN_VERTEX_SHADER], [gpu.FRAGMENT_SHADER, PIXEL_SCAN_FRAGMENT_SHADER]] as const) {
      const shader = gpu.createShader(type);
      if (!shader) { stop(); return; }
      shaders.push(shader);
      gpu.shaderSource(shader, source);
      gpu.compileShader(shader);
      if (!gpu.getShaderParameter(shader, gpu.COMPILE_STATUS)) { stop(); return; }
      gpu.attachShader(program, shader);
    }
    gpu.linkProgram(program);
    if (!gpu.getProgramParameter(program, gpu.LINK_STATUS)) { stop(); return; }
    gpu.useProgram(program);
    gpu.bindBuffer(gpu.ARRAY_BUFFER, buffer);
    gpu.bufferData(gpu.ARRAY_BUFFER, new Float32Array([-1,-1,0, 1,-1,0, -1,1,0, -1,1,0, 1,-1,0, 1,1,0]), gpu.STATIC_DRAW);
    const position = gpu.getAttribLocation(program, "position");
    gpu.enableVertexAttribArray(position);
    gpu.vertexAttribPointer(position, 3, gpu.FLOAT, false, 0, 0);
    gpu.enable(gpu.BLEND);
    gpu.blendFunc(gpu.ONE, gpu.ONE_MINUS_SRC_ALPHA);
    const uniform = (name: string) => gpu.getUniformLocation(program, name);
    gpu.activeTexture(gpu.TEXTURE0);
    gpu.bindTexture(gpu.TEXTURE_2D, texture);
    gpu.uniform1i(uniform("src"), 0);
    gpu.uniform2f(uniform("offset"), 0, 0);
    gpu.uniform1f(uniform("leaveTime"), 0);
    gpu.uniform1i(uniform("mode"), 3);
    gpu.uniform1f(uniform("speed"), 1);
    gpu.uniform1f(uniform("delay"), 0);
    gpu.uniform1f(uniform("width"), 0.2);
    gpu.uniform3f(uniform("accent"), 0.529, 0.918, 0.361);
    gpu.uniform3f(uniform("accent2"), 0.816, 1, 0.71);
    gpu.uniform3f(uniform("baseCol"), 0.184, 0.471, 0.114);
    gpu.uniform2f(uniform("mouse"), -10000, -10000);
    gpu.uniform1f(uniform("hover"), 0);
    gpu.uniform1f(uniform("spot"), 0.28);
    gpu.uniform2fv(uniform("trail[0]"), new Float32Array(48).fill(-10000));
    gpu.uniform1fv(uniform("trailW[0]"), new Float32Array(24));
    const word = document.createElement("canvas");
    const ctx = word.getContext("2d");
    if (!ctx) { stop(); return; }
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const nextWidth = Math.round(rect.width * dpr);
      const nextHeight = Math.round(rect.height * dpr);
      if (nextWidth < 2 || nextHeight < 2 || (nextWidth === width && nextHeight === height)) return;
      width = word.width = canvas.width = nextWidth;
      height = word.height = canvas.height = nextHeight;
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
      gpu.viewport(0, 0, width, height);
      gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true);
      gpu.texImage2D(gpu.TEXTURE_2D, 0, gpu.RGBA, gpu.RGBA, gpu.UNSIGNED_BYTE, word);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.LINEAR);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
      gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
      gpu.uniform2f(uniform("resolution"), width, height);
    };
    const timeUniform = uniform("time");
    const enterUniform = uniform("enterTime");
    const started = performance.now();
    let cycle = started;
    const frame = (now: number) => {
      if (disposed || gpu.isContextLost()) return;
      resize();
      if (width) {
        const elapsed = (now - cycle) / 1000;
        let enter = 2;
        if (elapsed <= 2.6) enter = 0.06 + (1 - (1 - elapsed / 2.6) ** 2) * 0.94;
        else if (elapsed > 3.7) { cycle = now; enter = 0.06; }
        gpu.uniform1f(timeUniform, (now - started) / 1000);
        gpu.uniform1f(enterUniform, enter);
        gpu.clearColor(0, 0, 0, 0);
        gpu.clear(gpu.COLOR_BUFFER_BIT);
        gpu.drawArrays(gpu.TRIANGLES, 0, 6);
        image.hidden = true;
        canvas.hidden = false;
      }
      raf = requestAnimationFrame(frame);
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    raf = requestAnimationFrame(frame);
  };
  const lost = (event: Event) => { event.preventDefault(); stop(); };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", start);
  image.addEventListener("load", start);
  motion.addEventListener("change", start);
  start();
  return () => {
    disposed = true;
    stop();
    motion.removeEventListener("change", start);
    image.removeEventListener("load", start);
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", start);
    host.replaceChildren();
  };
}

/** Keep the pinned player's readiness, blur and progress UI; replace only its brand mark. */
export function brandPlayerLoading(player: HTMLElement): () => void {
  const overlay = player.shadowRoot?.querySelector<HTMLElement>(".hfp-shader-loader");
  const mark = overlay?.querySelector<HTMLElement>(".hfp-shader-loader-mark");
  if (!overlay || !mark) return () => {};
  mark.replaceChildren();
  Object.assign(mark.style, { width: "234px", maxWidth: "70vw", height: "40px" });
  let stop: (() => void) | undefined;
  const update = () => {
    const visible = overlay.classList.contains("hfp-visible") || overlay.classList.contains("hfp-hiding");
    if (visible && !stop) stop = mountOpenDesignLoading(mark);
    if (!visible && stop) { stop(); stop = undefined; }
  };
  const observer = new MutationObserver(update);
  observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  update();
  return () => { observer.disconnect(); stop?.(); };
}
