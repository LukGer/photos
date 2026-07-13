# 001 — Blur-up / fade the detail-page image

- **Status**: DONE
- **Commit**: 4d82436
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens / Missed opportunities
- **Estimated scope**: 1 file (`src/pages/p/[slug].astro`), ~25 lines

## Problem

The gallery renders every thumbnail through `CrossfadeImage`, which fades a sharp
image in over a blurred `blurDataURL` placeholder (500ms opacity crossfade). When
the user clicks a polaroid and lands on the photo detail page, the full image
appears with **no transition at all** — it pops in as the bytes decode against a
black background. This is a visible seam: the app has taught the eye to expect a
graceful reveal, then drops it at the most important moment (the full-size photo).

The blur placeholder is already available on the data object (`imageData.blurDataURL`),
so nothing needs to be computed — the reveal is purely additive.

Current code:

```astro
<!-- src/pages/p/[slug].astro:28-38 — current -->
<div class="max-h-[80vh] max-w-full">
  <img
    src={imageData.src}
    alt={imageData.filename}
    width={imageData.width}
    height={imageData.height}
    class="max-h-[80vh] max-w-full object-contain"
    loading="eager"
    decoding="async"
  />
</div>
```

The gallery's reveal convention, to match exactly:

```tsx
// src/components/CrossfadeImage.tsx:120-122 — sharp image reveal
className={`... transition-opacity duration-500 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
```

```tsx
// src/components/CrossfadeImage.tsx:107-111 — blur placeholder fade-out
className="... blur-xl transition-opacity duration-500 ease-out data-[loaded=false]:opacity-100 data-[loaded=true]:opacity-0"
```

## Target

The full image fades in over its own blurred placeholder, using the **same
timing the gallery already uses**: `transition-opacity duration-500 ease-out`
(Tailwind's `ease-out` = `cubic-bezier(0, 0, 0.2, 1)`; keep it — do not swap to a
custom curve, matching `CrossfadeImage`). The image detail page is a static Astro
page with no React island, so drive the reveal with a tiny inline script that
flips a `data-loaded` attribute — no new dependency, no hydration.

```astro
<!-- target -->
<div class="relative max-h-[80vh] max-w-full">
  <img
    src={imageData.blurDataURL}
    alt=""
    aria-hidden="true"
    width={imageData.width}
    height={imageData.height}
    data-detail-blur
    class="pointer-events-none absolute inset-0 max-h-[80vh] max-w-full scale-105 object-contain blur-xl transition-opacity duration-500 ease-out"
  />
  <img
    src={imageData.src}
    alt={imageData.filename}
    width={imageData.width}
    height={imageData.height}
    data-detail-image
    data-loaded="false"
    class="relative max-h-[80vh] max-w-full object-contain opacity-0 transition-opacity duration-500 ease-out data-[loaded=true]:opacity-100"
    loading="eager"
    decoding="async"
  />
</div>
```

Reveal script — decode-safe (handles the cached/already-complete case), scoped
to this page:

```astro
<script>
  function reveal(img: HTMLImageElement) {
    img.dataset.loaded = "true";
    const blur = img.parentElement?.querySelector<HTMLElement>("[data-detail-blur]");
    if (blur) blur.style.opacity = "0";
  }
  document.querySelectorAll<HTMLImageElement>("[data-detail-image]").forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      // Already decoded (cache hit) — reveal on next frame so the transition runs.
      requestAnimationFrame(() => reveal(img));
    } else {
      img.addEventListener("load", () => reveal(img), { once: true });
    }
  });
</script>
```

The blur placeholder starts fully opaque (no `opacity-0`), so there is never a
flash of black before the sharp image loads.

## Repo conventions to follow

- The reveal timing/easing is copied verbatim from `CrossfadeImage.tsx:120` —
  `transition-opacity duration-500 ease-out`. Do not introduce a new duration or
  curve; cohesion with the gallery is the whole point.
- Blur placeholder styling mirrors `CrossfadeImage.tsx:111`: `blur-xl` + a slight
  upscale (`scale-105`, vs. the gallery's `scale-110` — smaller here because the
  detail image is `object-contain`, not `object-cover`, so less bleed is needed to
  hide blurred edges).
- Astro `<script>` tags are processed and bundled by Astro; TypeScript is allowed
  inside them (this file is `.astro`). Place the script at the bottom of the file,
  after the closing `</Layout>` is fine, or anywhere in the template — Astro hoists it.

## Steps

1. In `src/pages/p/[slug].astro`, replace the `<div class="max-h-[80vh] max-w-full">`
   block (lines 28-38) with the two-image `relative` container from **Target**.
   Both images keep the same `width`/`height`/`object-contain`/`max-h-[80vh]
   max-w-full` so they resolve to the identical displayed box (required for the
   blur to register behind the sharp image).
2. Add the reveal `<script>` from **Target** to the same file.
3. Confirm `imageData.blurDataURL` exists on the type — it is already consumed by
   `Polaroid.tsx:24` via `item.blurDataURL`, so the field is present on
   `MetadataItem`. Do not add or rename fields.

## Boundaries

- Do NOT touch `CrossfadeImage.tsx`, `Polaroid.tsx`, or the gallery — this is the
  detail page only.
- Do NOT convert the detail image into a React island; keep it static Astro + one
  inline script.
- Do NOT add the retro/dither treatment to the detail page — that is deliberately
  gallery-only.
- Do NOT change the duration or easing; match the gallery exactly.
- Do NOT add new dependencies.
- If the current markup at `[slug].astro:28-38` no longer matches the excerpt
  above (drift since commit `4d82436`), STOP and report.

## Verification

- **Mechanical**: `bun run build` completes without type or template errors.
  (`bun run lint` runs oxlint with `--fix`; expect no new warnings from the added
  script.)
- **Feel check**: run `bun run dev`, open the gallery, click a photo.
  - In DevTools → Network, throttle to "Slow 4G" and hard-reload the detail page:
    the blurred placeholder shows immediately, then the sharp photo fades in over
    ~500ms. There is **no** black-to-photo pop.
  - Navigate back and re-open the same photo (now cached): it should still fade in
    (the `requestAnimationFrame` cache-hit path), not snap.
  - Open DevTools → Animations, set speed to 10%, reload: confirm the sharp image
    goes opacity 0→1 while the blur goes 1→0 over the same window (a crossfade, not
    a sequential swap).
- **Done when**: the detail photo always reveals via a blur-up crossfade that
  matches the gallery's timing, on both cold-load and cached navigation.
