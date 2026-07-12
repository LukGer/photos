# Retro dither + palette quantization — implementation brief

## Goal

A screen-space post-process that gives images/scenes a retro look: a **reduced color
palette** plus **ordered (Bayer) dithering** to fake the in-between tones. Runs as one
full-screen fragment-shader pass over the final framebuffer texture, so it works on
photos, 3D scenes, or video — order-independent, no state, cheap.

Two variants below. Ship whichever fits; A is simpler, B nails a specific palette.

---

## Shared helpers (GLSL ES 3.00)

```glsl
// Normalized Bayer threshold matrices, each returns [0,1). Tile across the screen.
float bayer2(ivec2 q){ const float m[4]=float[4](0.,2.,3.,1.);
  return m[(q.y&1)*2+(q.x&1)]/4.; }
float bayer4(ivec2 q){ const float m[16]=float[16](
  0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return m[(q.y&3)*4+(q.x&3)]/16.; }
float bayer8(ivec2 q){ const float m[64]=float[64](
  0.,32.,8.,40.,2.,34.,10.,42., 48.,16.,56.,24.,50.,18.,58.,26.,
  12.,44.,4.,36.,14.,46.,6.,38., 60.,28.,52.,20.,62.,30.,54.,22.,
  3.,35.,11.,43.,1.,33.,9.,41., 51.,19.,59.,27.,49.,17.,57.,25.,
  15.,47.,7.,39.,13.,45.,5.,37., 63.,31.,55.,23.,61.,29.,53.,21.);
  return m[(q.y&7)*8+(q.x&7)]/64.; }
```

`ivec2 q` is the integer pixel coordinate (`ivec2(gl_FragCoord.xy)`, or divide by
`pixelSize` first if you want chunky blocks). 8x8 is the closest match to the reference look.

---

## Variant A — per-channel quantization

Cheapest. Good on natural scenes. Each channel is rounded independently to `levels` steps;
the Bayer value nudges each pixel across a rounding boundary so gradients break into a
stable dither pattern that averages back to the original.

```glsl
vec3 ditherQuantize(vec3 c, float levels, ivec2 q, float strength){
  float t = bayer8(q) - 0.5;                 // center to [-0.5, 0.5)
  c += t * strength / (levels - 1.0);        // amplitude ~ one quantization step
  return floor(c * (levels - 1.0) + 0.5) / (levels - 1.0);
}
```

Key detail: the dither amplitude must scale with `1.0/(levels-1.0)` (one quant step),
otherwise it's invisible or turns to noise. `strength` around 1.0 is the classic amount.
`levels` = steps per channel; 4–6 gives the prominent retro look, higher = subtler.

---

## Variant B — fixed palette LUT

Snaps to an explicit palette. For each pixel, find the two nearest palette colors, work out
how far the source sits between them, and use the Bayer threshold to pick one or the other.
Neighborhoods then mix optically back to the source tone.

```glsl
uniform vec3 uPal[12];
const int PN = 12;

void nearest2(vec3 c, out vec3 c1, out vec3 c2){
  float d1=1e9, d2=1e9; c1=uPal[0]; c2=uPal[1];
  for(int i=0;i<PN;i++){
    vec3 e = c - uPal[i]; float d = dot(e,e);
    if(d<d1){ d2=d1; c2=c1; d1=d; c1=uPal[i]; }
    else if(d<d2){ d2=d; c2=uPal[i]; }
  }
}

vec3 paletteDither(vec3 src, ivec2 q, float strength){
  vec3 c1, c2; nearest2(src, c1, c2);
  vec3 diff = c2 - c1;
  float t = clamp(dot(src - c1, diff) / (dot(diff,diff) + 1e-6), 0.0, 1.0); // frac toward c2
  float thr = mix(0.5, bayer8(q), strength);   // strength 0 = hard snap, 1 = full dither
  return (t > thr) ? c2 : c1;
}
```

O(palette size) per pixel — fine up to ~64+ colors. Upload the palette as
`gl.uniform3fv(loc, flatFloat32Array)` with values in 0–1.

---

## Optional: chunky pixels

For a lower-res grid, snap the sample coordinate and index Bayer by block before either
variant:

```glsl
vec2 block = (floor(gl_FragCoord.xy / uPixel) + 0.5) * uPixel;
vec3 src    = texture(uScene, block / uRes).rgb;   // or scene(block/uRes)
ivec2 q     = ivec2(gl_FragCoord.xy / uPixel);
```

---

## Parameters to expose

- `levels` (Variant A): steps per channel, 2–16. ~4–6 for the strong look.
- `bayer size`: 2 / 4 / 8. Use 8 to match the reference.
- `strength`: dither amount. A: ~0–1.6 (≈1.0 default). B: 0–1 (0=snap, 1=full dither).
- `pixelSize`: 1–6, optional chunkiness.

---

## Reference palette (12 colors, warm/cool)

Extracted from the source images. Cool teal→azure ramp against a warm rust→sand ramp.

```
Cool:  #062427  #1F4C5D  #26718B  #3381B3  #4C9ECF  #79B1CA
Warm:  #3E1E14  #6E4630  #A68464  #CBB89F  #DED5C3  #E1EAE4
```

The "vibrancy" of the source is mostly structural, not the raw hexes: warm/cool
complementary split, **shadows tinted deep teal rather than neutral black**, one clean
bright highlight, and the dithering itself vibrating adjacent colors into a perceived
third. Keep those properties if generating new palettes.

---

## Gotchas

- **Use ordered (Bayer), not error diffusion.** Floyd–Steinberg looks less mechanical but
  is sequential (each pixel depends on neighbors' propagated error) — doesn't map to a
  fragment shader and isn't temporally stable if animated. The reference look is ordered anyway.
- **Amplitude scaling (Variant A)** must track the quantization step size, per the note above.
- **Color space:** distance in Variant B is plain sRGB here, which matches these hexes fine.
  If matches look perceptually wrong, convert `src` and palette to **OKLab** once and compare
  there — same code, better metric.
- **Better palette matching (Variant B):** nearest-two-then-project is the cheap version.
  For a palette whose two literally-nearest entries don't bracket the target well, use
  Yliluoma's ordered dithering (searches for the best *mixture* pair). Overkill for a
  ramp-structured palette like the one above.
- Apply as the **last** pass, after tonemapping/color grade, on the resolved framebuffer.
```
