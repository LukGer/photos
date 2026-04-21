# Photos

Static photography gallery built with [Astro](https://astro.build/), [React](https://react.dev/) (islands for motion / magnetic hover), and [Tailwind CSS](https://tailwindcss.com/).

Source images live in `images/`. `bun run build` runs `generate:meta` first: Sharp writes AVIFs to `public/photos/`, refreshes `public/meta.json` (EXIF, blur placeholders). **`location`** is only inferred (embedded IPTC/XMP-style tags, else **GPS + OpenStreetMap Nominatim**, English labels, ~1 req/s) when it is not already set for that photo—so geocoding is skipped for rows with a non-empty `location`. **Non-empty `title` and `location`** are still preserved on merge. Set `NOMINATIM_USER_AGENT` to a stable app id + contact URL for bulk builds ([Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)). Run `bun run generate:meta` alone to regenerate without a full site build.

## Scripts

```bash
bun install
bun run dev      # astro dev
bun run build    # static site → dist/
bun run preview  # astro preview
bun run generate:meta
```

## Deploy

`dist/` is plain static HTML/CSS/JS. Host on any static file host (Netlify, S3, etc.) with the document root set to `dist`.

### Vercel

[`vercel.json`](vercel.json) pins **install** (`bun install`), **build** (`bun run build` → `generate:meta` then `astro build`), **output** (`dist`), and the **Astro** framework preset so Git pushes match local production builds. Commit the `images/` folder (or otherwise provide sources) so `generate:meta` can run on Vercel.
