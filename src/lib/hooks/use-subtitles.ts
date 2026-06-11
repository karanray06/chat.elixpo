"use client";

import { useState, useEffect } from "react";
import type { TimelineEntry } from "@/lib/types";

export interface SubLine {
  text: string;
  speaker: "male" | "female";
  start: number;
  end: number;
}

/**
 * Given a set of timeline entries and the current playback time, computes the
 * active subtitle chunk (~50 chars) from the matching entry.
 *
 * This logic was duplicated verbatim in both the news and podcast pages.
 */
export function useSubtitles(timeline: TimelineEntry[], currentTime: number): SubLine | null {
  const [activeSubLine, setActiveSubLine] = useState<SubLine | null>(null);

  useEffect(() => {
    const entry = timeline.find(
      (e) => (e.type === "male" || e.type === "female") && currentTime >= e.start && currentTime < e.end,
    );
    if (!entry) {
      setActiveSubLine((prev) => (prev ? null : prev));
      return;
    }

    const words = entry.content.split(/\s+/);
    const chunks: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur.length + w.length + 1 > 50 && cur) {
        chunks.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    }
    if (cur) chunks.push(cur);

    const progress = (currentTime - entry.start) / (entry.end - entry.start);
    const idx = Math.min(Math.floor(progress * chunks.length), chunks.length - 1);

    setActiveSubLine((prev) => {
      if (prev?.text === chunks[idx]) return prev;
      return { text: chunks[idx], speaker: entry.type as "male" | "female", start: entry.start, end: entry.end };
    });
  }, [currentTime, timeline]);

  return activeSubLine;
}
