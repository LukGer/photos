# 003 — Scope the tabs indicator transition off `transition-all`

- **Status**: DONE
- **Commit**: 4d82436
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 file (`src/components/ui/tabs.tsx`), 1 line

## Problem

The Base UI tab indicator (the sliding pill behind the active tab in the retro
toggle) animates with `transition-all`:

```tsx
// src/components/ui/tabs.tsx:30-32 — current
<TabsPrimitive.Indicator
  className="absolute top-(--active-tab-top) left-(--active-tab-left) z-0 h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-background shadow-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
/>
```

Two problems, both from `transition-all` (AUDIT §5 — `transition: all` is always a
finding):

1. It transitions **every** animatable property that changes, including ones we
   never intend to animate (e.g. `box-shadow`, colors on theme flip). Any future
   change to the element gets an unrequested 200ms tween.
2. The properties that *do* drive the pill — `top`, `left`, `width`, `height`
   (set as CSS vars `--active-tab-*` by Base UI) — are **layout properties**, so
   each frame runs layout + paint off the GPU.

## Target

Restrict the transition to exactly the four properties that move the pill. This
removes the accidental `all` transitions immediately and makes the intent explicit:

```tsx
// target
<TabsPrimitive.Indicator
  className="absolute top-(--active-tab-top) left-(--active-tab-left) z-0 h-(--active-tab-height) w-(--active-tab-width) rounded-md bg-background shadow-sm transition-[top,left,width,height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
/>
```

Only the class changes: `transition-all` → `transition-[top,left,width,height]`.
Duration (`200ms`) and easing are unchanged.

**Known limitation (do not attempt to fix in this plan):** `top/left/width/height`
are layout-triggering, and a fully GPU-composited version would require driving the
pill with `transform`/`scale`. Base UI positions its `Indicator` via the
`--active-tab-*` CSS variables, not transforms, so a transform rewrite means
reworking how the indicator is positioned — out of scope here and low payoff for a
2-tab toggle that moves occasionally. Scoping away from `all` is the correct,
safe win.

## Repo conventions to follow

- Tailwind v4 arbitrary transition-property syntax is `transition-[a,b,c]` (no
  spaces inside the brackets). This is the same bracketed-arbitrary style already
  used elsewhere in this file, e.g. the easing `ease-[cubic-bezier(0.23,1,0.32,1)]`
  on the same line.
- Leave the hand-typed `cubic-bezier(0.23,1,0.32,1)` easing literal exactly as-is.
  (Consolidating it onto the `--ease-out-strong` token is a separate, unselected
  finding — do not touch it here.)

## Steps

1. In `src/components/ui/tabs.tsx`, on the `TabsPrimitive.Indicator` `className`
   (line 31), replace the token `transition-all` with `transition-[top,left,width,height]`.
   Change nothing else on the line.

## Boundaries

- Do NOT change the duration or easing.
- Do NOT rewrite the indicator to use `transform`/`scale` (see Known limitation).
- Do NOT touch `TabsList`, `TabsTrigger`, `TabsContent`, or any other component.
- Do NOT add new dependencies.
- If `tabs.tsx:31` no longer contains `transition-all` (drift since commit
  `4d82436`), STOP and report.

## Verification

- **Mechanical**: `bun run build` completes; `bun run lint` reports no new warnings.
  Confirm the compiled class list still includes a `transition-property` covering
  top/left/width/height (inspect the rendered element in DevTools).
- **Feel check**: run `bun run dev`, open the gallery, click the retro toggle
  (`RetroToggle`) back and forth.
  - The pill still slides between the two tabs over ~200ms with the same easing —
    visually identical to before.
  - DevTools → Animations at 10% speed: the pill slides smoothly; only its
    position/size animate, nothing else flickers.
  - Toggle rapidly: the slide retargets cleanly (CSS transitions already handle
    interruption — no regression expected).
- **Done when**: `transition-all` is gone from the indicator, the pill animates
  identically, and no unrelated property tweens on interaction.
