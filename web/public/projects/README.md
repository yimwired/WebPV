# Project preview images

Drop screenshots here, then reference them in `src/lib/projects.ts` via the
`image` field, e.g.:

```ts
image: "/projects/aurum.png",
```

**Export as WebP, no wider than 1200px.** The site builds with
`output: "export"`, so `next/image` runs with `unoptimized: true` and ships
whatever is in this folder byte for byte — there is no server left to resize on
request. A raw screenshot PNG costs about a megabyte and the card renders at
1152px at the very most.

To convert one that arrived as a PNG:

```powershell
ffmpeg -i shot.png -vf "scale='min(1200,iw)':-2:flags=lanczos" `
  -c:v libwebp -quality 82 -compression_level 6 name.webp
```

That pass took the five images here from 2,984 KB to 268 KB with no visible
loss at 1:1 — check small text and UI chrome before accepting a lower quality.

If a project has no `image`, the card shows a styled placeholder automatically.
