/**
 * Shared WebGL2 palette-dither processor (Variant B from dither-quantize-shader-brief.md).
 *
 * Browsers cap the number of live WebGL contexts, so a single offscreen context
 * processes every image on demand and the result is handed back as an ImageBitmap
 * that callers paint into their own 2D canvas. Results are cached per src+size.
 */

// 12-color reference palette: cool teal -> azure ramp against a warm rust -> sand ramp.
const PALETTE_HEX = [
  "#062427", "#1F4C5D", "#26718B", "#3381B3", "#4C9ECF", "#79B1CA",
  "#3E1E14", "#6E4630", "#A68464", "#CBB89F", "#DED5C3", "#E1EAE4",
];

const STRENGTH = 1.0;
const PIXEL_SIZE = 2.0;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const PALETTE_FLAT = new Float32Array(PALETTE_HEX.flatMap(hexToRgb));

const VERT_SRC = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uRes;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform float uPixel;
uniform float uStrength;
uniform vec3 uPal[12];
const int PN = 12;

out vec4 fragColor;

float bayer8(ivec2 q) {
  const float m[64] = float[64](
    0.,32.,8.,40.,2.,34.,10.,42., 48.,16.,56.,24.,50.,18.,58.,26.,
    12.,44.,4.,36.,14.,46.,6.,38., 60.,28.,52.,20.,62.,30.,54.,22.,
    3.,35.,11.,43.,1.,33.,9.,41., 51.,19.,59.,27.,49.,17.,57.,25.,
    15.,47.,7.,39.,13.,45.,5.,37., 63.,31.,55.,23.,61.,29.,53.,21.);
  return m[(q.y & 7) * 8 + (q.x & 7)] / 64.;
}

void nearest2(vec3 c, out vec3 c1, out vec3 c2) {
  float d1 = 1e9, d2 = 1e9;
  c1 = uPal[0];
  c2 = uPal[1];
  for (int i = 0; i < PN; i++) {
    vec3 e = c - uPal[i];
    float d = dot(e, e);
    if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = uPal[i]; }
    else if (d < d2) { d2 = d; c2 = uPal[i]; }
  }
}

vec3 paletteDither(vec3 src, ivec2 q, float strength) {
  vec3 c1, c2;
  nearest2(src, c1, c2);
  vec3 diff = c2 - c1;
  float t = clamp(dot(src - c1, diff) / (dot(diff, diff) + 1e-6), 0.0, 1.0);
  float thr = mix(0.5, bayer8(q), strength);
  return (t > thr) ? c2 : c1;
}

void main() {
  vec2 block = (floor(gl_FragCoord.xy / uPixel) + 0.5) * uPixel;
  vec2 uv = (block / uRes) * uUvScale + uUvOffset;
  vec3 src = texture(uScene, uv).rgb;
  ivec2 q = ivec2(gl_FragCoord.xy / uPixel);
  fragColor = vec4(paletteDither(src, q, uStrength), 1.0);
}`;

type GLState = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: {
    uRes: WebGLUniformLocation | null;
    uUvScale: WebGLUniformLocation | null;
    uUvOffset: WebGLUniformLocation | null;
    uPixel: WebGLUniformLocation | null;
    uStrength: WebGLUniformLocation | null;
    uPal: WebGLUniformLocation | null;
    uScene: WebGLUniformLocation | null;
  };
};

let state: GLState | null = null;
let unsupported = false;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Dither shader compile failed: ${log}`);
  }
  return shader;
}

function init(): GLState | null {
  if (state) return state;
  if (unsupported) return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) {
    unsupported = true;
    return null;
  }

  try {
    const vert = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Dither program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.deleteShader(vert);
    gl.deleteShader(frag);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    state = {
      canvas,
      gl,
      program,
      texture,
      uniforms: {
        uRes: gl.getUniformLocation(program, "uRes"),
        uUvScale: gl.getUniformLocation(program, "uUvScale"),
        uUvOffset: gl.getUniformLocation(program, "uUvOffset"),
        uPixel: gl.getUniformLocation(program, "uPixel"),
        uStrength: gl.getUniformLocation(program, "uStrength"),
        uPal: gl.getUniformLocation(program, "uPal"),
        uScene: gl.getUniformLocation(program, "uScene"),
      },
    };
    return state;
  } catch (err) {
    console.warn(err);
    unsupported = true;
    return null;
  }
}

const cache = new Map<string, ImageBitmap>();

function keyFor(src: string, w: number, h: number): string {
  return `${src}@${w}x${h}`;
}

export function isRetroSupported(): boolean {
  return !unsupported;
}

/**
 * Runs the palette-dither pass over `img` at the given pixel dimensions and
 * returns an ImageBitmap of the result. Cached per src+size.
 */
export async function ditherImage(
  img: HTMLImageElement,
  width: number,
  height: number,
): Promise<ImageBitmap | null> {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const key = keyFor(img.currentSrc || img.src, w, h);
  const cached = cache.get(key);
  if (cached) return cached;

  const s = init();
  if (!s) return null;
  const { gl, canvas, program, texture, uniforms } = s;

  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  } catch (err) {
    console.warn("Dither texture upload failed (image may be cross-origin):", err);
    return null;
  }

  // Cover crop: sample the image the same way CSS `object-fit: cover` would.
  const imgW = img.naturalWidth || w;
  const imgH = img.naturalHeight || h;
  const canvasAspect = w / h;
  const imgAspect = imgW / imgH;
  let scaleX = 1;
  let scaleY = 1;
  if (imgAspect > canvasAspect) {
    scaleX = canvasAspect / imgAspect;
  } else {
    scaleY = imgAspect / canvasAspect;
  }
  const offsetX = (1 - scaleX) / 2;
  const offsetY = (1 - scaleY) / 2;

  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms.uScene, 0);
  gl.uniform2f(uniforms.uRes, w, h);
  gl.uniform2f(uniforms.uUvScale, scaleX, scaleY);
  gl.uniform2f(uniforms.uUvOffset, offsetX, offsetY);
  gl.uniform1f(uniforms.uPixel, PIXEL_SIZE);
  gl.uniform1f(uniforms.uStrength, STRENGTH);
  gl.uniform3fv(uniforms.uPal, PALETTE_FLAT);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  const bitmap = await createImageBitmap(canvas);
  cache.set(key, bitmap);
  return bitmap;
}
