"use client";

import { useState } from "react";

interface StaticLabFrameProps {
  /** file under /public/lab-demos, e.g. "sable.html" */
  file: string;
  /** accessible name for the embedded document */
  title: string;
  /** page background while the frame loads — match the demo's own */
  backdrop: string;
}

/**
 * Wrapper for the two lab demos that are standalone HTML documents
 * rather than React pages.
 *
 * They stay in `/public/lab-demos` and load in a frame on purpose: both
 * declare their own `:root` custom properties (`--paper`, `--ink`,
 * `--slate`), which would leak into the site's shadcn oklch tokens
 * if their CSS were imported into the app.
 *
 * The folder is deliberately not `/public/labs`: `output: "export"` writes the
 * route /labs/sable to out/labs/sable.html, which overwrites a public file of
 * the same name, and the frame then loads this very page inside itself.
 */
export function StaticLabFrame({ file, title, backdrop }: StaticLabFrameProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{ background: backdrop }}
    >
      <iframe
        src={`/lab-demos/${file}`}
        title={title}
        onLoad={() => setLoaded(true)}
        className="h-full w-full border-0 transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      <span className="sr-only" role="status">
        {loaded ? `${title} loaded` : `Loading ${title}`}
      </span>
    </main>
  );
}
