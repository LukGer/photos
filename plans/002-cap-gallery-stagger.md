# 002 — Cap the gallery entrance stagger and zero it under reduced motion

- **Status**: DONE
- **Commit**: 4d82436
- **Severity**: MEDIUM
- **Category**: Purpose & frequency / Cohesion & tokens
- **Estimated scope**: 1 file (`src/components/Gallery.tsx`), ~4 lines

## Problem

Each gallery card gets an entrance delay that grows linearly and **unbounded**
with its index:

```tsx
// src/components/Gallery.tsx:13-19 — current
{items.map((item, index) => (
  <a
    key={item.filename}
    href={`/p/${item.filename}`}
    className="gallery-card-enter relative block min-h-0 min-w-0"
    style={{ animationDelay: `${index * 42}ms` }}
  >
```

The entrance animation uses `both` fill mode, so a card is at `opacity: 0` until
its delay elapses:

```css
/* src/styles/global.css:199-201 */
.gallery-card-enter {
  animation: gallery-enter 0.38s cubic-bezier(0.23, 1, 0.32, 1) both;
}
```

With a real photo set this is a problem:

- Card #20 waits **840ms**, card #40 waits **1680ms**, card #60 waits **2520ms** —
  invisible and unclickable that whole time. A stagger is decorative and must never
  block interaction (AUDIT §7); here it does.
- The delay is an **inline style**, so the `prefers-reduced-motion` block at
  `global.css:203-209` cannot override it — it only swaps the keyframe. A
  reduced-motion user still sits through the full 2s+ cascade before the last cards
  appear. That is the opposite of what reduced motion should do.

## Target

Cap the cumulative delay so the whole grid finishes staggering within ~500ms, and
collapse the delay to `0ms` under reduced motion. Keep the 42ms step (it is within
AUDIT's 30–80ms stagger range) and keep the `both` fill and the keyframe as-is.

```tsx
// target
import { useReducedMotion } from "motion/react";
// ...
export function Gallery({ items }: { items: MetadataItem[] }) {
  const retro = useRetroMode();
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
      {items.map((item, index) => (
        <a
          key={item.filename}
          href={`/p/${item.filename}`}
          className="gallery-card-enter relative block min-h-0 min-w-0"
          style={{
            animationDelay: reduceMotion ? "0ms" : `${Math.min(index, 12) * 42}ms`,
          }}
        >
```

`Math.min(index, 12) * 42` caps the delay at **504ms** — every card past the 13th
enters together at that point, so the cascade reads as a wave rather than a queue,
and no card is invisible for longer than ~0.9s (504ms delay + 380ms animation).

## Repo conventions to follow

- `useReducedMotion` from `motion/react` is already the codebase's reduced-motion
  primitive — see `src/components/Magnetic.tsx:4,61` (`const shouldReduceMotion =
  useReducedMotion();`). Import it the same way.
- `Gallery` is already a `"use client"` island (it calls `useRetroMode()`), so
  adding another hook is safe and needs no new directive.
- Do not touch the keyframes or the `.gallery-card-enter` rule — the fix is entirely
  in the inline `animationDelay`.

## Steps

1. In `src/components/Gallery.tsx`, add `import { useReducedMotion } from "motion/react";`
   to the imports.
2. Inside the component, after `const retro = useRetroMode();`, add
   `const reduceMotion = useReducedMotion();`.
3. Replace the inline style with:
   `style={{ animationDelay: reduceMotion ? "0ms" : \`${Math.min(index, 12) * 42}ms\` }}`.

## Boundaries

- Do NOT change `global.css` (the keyframes and reduced-motion block are correct;
  the delay was the only leak).
- Do NOT change the 42ms step or the `both` fill mode.
- Do NOT remove the entrance animation — only bound it.
- Do NOT add new dependencies (`motion` is already installed).
- If `Gallery.tsx:13-19` no longer matches the excerpt above (drift since commit
  `4d82436`), STOP and report.

## Verification

- **Mechanical**: `bun run build` completes; `bun run lint` reports no new warnings.
- **Feel check**: run `bun run dev` with a gallery of 20+ photos.
  - Hard-reload: the first ~13 cards fan in as a wave; everything past that appears
    together by ~0.5s. No card stays blank for more than ~1s.
  - DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", then
    reload: **all** cards fade in essentially together (no positional slide, no
    multi-second cascade). The reduced-motion keyframe (opacity-only) still runs.
  - DevTools → Animations at 10% speed: confirm the last cards' delay is clamped,
    not proportional to their index.
- **Done when**: no card is invisible longer than ~1s regardless of grid size, and
  reduced motion shows a near-simultaneous opacity fade with zero stagger delay.
