"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RotateCcw, Play } from "lucide-react";

/**
 * A clip that starts when it arrives and then stops, the way a hardware
 * launch page plays one.
 *
 * Nothing is fetched until the clip is nearly on screen: `preload="none"` and
 * the sources are attached by the observer, so a viewer who never scrolls this
 * far pays nothing for it. The poster is the same photograph as the clip's
 * first frame, so there is no flash when the video takes over.
 *
 * It plays once. Looping a product shot turns it into wallpaper, and motion
 * that repeats forever stops reporting anything.
 */

interface Source {
  src: string;
  type: string;
}

export function UnfoldClip({
  sources,
  poster,
  label,
  className = "",
}: {
  sources: Source[];
  poster: string;
  /** describes the motion, for anyone who cannot see it play */
  label: string;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");

  const start = useCallback(() => {
    const node = video.current;
    if (!node) return;
    node.currentTime = 0;
    void node.play().then(
      () => setState("playing"),
      // autoplay can be refused whatever the attributes say; the control is
      // already there, so the honest fallback is to leave it to the viewer
      () => setState("idle")
    );
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node) return;

    // Reduced motion gets the poster and a button. The clip is the substance
    // of this section, so it stays reachable rather than being removed.
    if (reduced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        node.load();
        start();
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, start]);

  const idle = state !== "playing";

  return (
    <div className={`relative ${className}`}>
      <video
        ref={video}
        poster={poster}
        aria-label={label}
        muted
        playsInline
        preload="none"
        onEnded={() => setState("ended")}
        className="h-full w-full object-cover"
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>

      {/* One control, and it says which thing it will do. It is only in the
          way while the clip is not running. */}
      {idle && (
        <button
          type="button"
          onClick={start}
          className="absolute right-4 bottom-4 inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full bg-black/55 px-4 text-[0.8125rem] font-medium text-white backdrop-blur-none transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {state === "ended" ? (
            <>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Replay
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden />
              Play
            </>
          )}
        </button>
      )}
    </div>
  );
}
