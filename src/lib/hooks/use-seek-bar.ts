"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseSeekBarOpts {
  /** Return the current HTMLAudioElement (may be null before load). */
  getAudio: () => HTMLAudioElement | null;
  duration: number;
  currentTime: number;
}

/**
 * Encapsulates the drag-to-seek logic duplicated across news and podcast
 * pages: seekFromX computation, isDragging ref, pointer/touch event
 * listeners, time formatting, and progress percentage.
 */
export function useSeekBar({ getAudio, duration, currentTime }: UseSeekBarOpts) {
  const seekBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const seekFromX = useCallback(
    (clientX: number) => {
      if (!seekBarRef.current) return;
      const audio = getAudio();
      if (!audio) return;
      const r = seekBarRef.current.getBoundingClientRect();
      const clamped = Math.max(0, Math.min(clientX - r.left, r.width));
      const target = audio.duration || duration;
      if (target) audio.currentTime = (clamped / r.width) * target;
    },
    [getAudio, duration],
  );

  const onSeekDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isDragging.current = true;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      seekFromX(x);
    },
    [seekFromX],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      seekFromX(x);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  });

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return { seekBarRef, onSeekDown, pct };
}

/** Format seconds → `m:ss` */
export function formatTime(s: number): string {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Build a Google S2 favicon URL for a domain, or empty string. */
export function faviconUrl(domain: string | undefined): string {
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";
}
