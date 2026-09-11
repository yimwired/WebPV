"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

/**
 * A clip that plays when it arrives and stops, the way a hardware launch page
 * plays one.
 *
 * Nothing is fetched until it is nearly on screen: `preload="none"` and the
 * sources are attached by the observer, so a viewer who never scrolls this far
 * pays nothing for it. The poster is the same photograph as the first frame,
 * so there is no flash when the video takes over.
 *
 * The observer is never disconnected. Staying on the section plays it once and
 * leaves it on its last frame - looping a product shot turns it into wallpaper
 * - but scrolling away and coming back is a new arrival, and it starts again.
 * That is the behaviour without a control to press, which is why there is not
 * one.
 *
 * Reduced motion is the exception: nothing starts on its own there, so the
 * clip would be unreachable without a button, and it gets one.
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
  const loaded = useRef(false);
  const reduced = useReducedMotion() ?? false;
  // Only the refusal is state. Whether reduced motion needs a button is a fact
  // about the preference, not something to write during an effect.
  const [refused, setRefused] = useState(false);
  const showButton = reduced || refused;

  const start = useCallback(() => {
    const node = video.current;
    if (!node) return;
    if (!loaded.current) {
      node.load();
      loaded.current = true;
    }
    node.currentTime = 0;
    void node.play().then(
      () => setRefused(false),
      // autoplay can be refused whatever the attributes say; falling back to a
      // button is the only honest answer when it is
      () => setRefused(true)
    );
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!node) return;

    // Nothing starts on its own under reduced motion, so the button is the
    // only way in and `showButton` already accounts for it.
    if (reduced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, start]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={video}
        poster={poster}
        aria-label={label}
        muted
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>

      {showButton && (
        <button
          type="button"
          onClick={start}
          className="absolute right-4 bottom-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-black/55 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Play className="h-4 w-4" aria-hidden />
          Play
        </button>
      )}
    </div>
  );
}
