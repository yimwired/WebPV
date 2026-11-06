"use client";

import { useCallback, useState } from "react";

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

  // A frame that finishes before this page hydrates never fires onLoad, and the
  // demo would stay invisible behind its backdrop for good. A cached demo on a
  // slow device does exactly that, so ask the frame itself once React arrives.
  const catchEarlyLoad = useCallback((frame: HTMLIFrameElement | null) => {
    const demo = frame?.contentDocument;
    if (demo && demo.URL !== "about:blank" && demo.readyState === "complete") {
      setLoaded(true);
    }
  }, []);

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{ background: backdrop }}
    >
      {/* The frame's own headings belong to its document, not this page. */}
      <h1 className="sr-only">{title}</h1>
      <iframe
        ref={catchEarlyLoad}
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
