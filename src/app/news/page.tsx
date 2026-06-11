"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { NewsItem } from "@/lib/types";
import NewsSkeleton from "@/components/skeletons/NewsSkeleton";
import { useSeekBar, formatTime, faviconUrl as buildFaviconUrl } from "@/lib/hooks/use-seek-bar";
import { useSubtitles } from "@/lib/hooks/use-subtitles";
import BackButton from "@/components/media/BackButton";
import MediaOverlay from "@/components/media/MediaOverlay";
import { PlayIcon, PauseIcon } from "@/components/media/PlayPauseIcon";

const CATEGORY_COLORS: Record<string, string> = {
  tech: "#f59e0b", science: "#10b981", sports: "#3b82f6", health: "#ef4444",
  entertainment: "#a855f7", travel: "#06b6d4", business: "#f97316",
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gradientColor, setGradientColor] = useState("#1a1a2e");
  const [showCaptions, setShowCaptions] = useState(true);

  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headline = `Elixpo Daily — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  useEffect(() => {
    fetch("/api/news").then((r) => r.json()).then((data: any) => {
      if (!data || !data.items) {
        setItems([]);
        setLoading(false);
        return;
      }
      const newsItems: NewsItem[] = Array.isArray(data.items) ? data.items : Object.values(data.items);
      setItems(newsItems);
      audioRefs.current = newsItems.map((item) => {
        if (!item.audio_url) return null as unknown as HTMLAudioElement;
        const audio = new Audio(item.audio_url);
        audio.preload = "auto";
        return audio;
      });
      setLoading(false);
    }).catch(console.error);

    return () => {
      audioRefs.current.forEach((a) => { a.pause(); a.src = ""; });
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, []);

  // Update gradient color from current item
  const updateGradient = useCallback((item: NewsItem) => {
    if (item.gradient_color) {
      setGradientColor(item.gradient_color);
    } else if (item.image_url) {
      fetch(`/api/dominant-color?imageUrl=${encodeURIComponent(item.image_url)}`)
        .then((r) => r.json())
        .then((d: any) => setGradientColor(d.color))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const audio = audioRefs.current[currentIdx];
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (currentIdx < items.length - 1) {
        const next = currentIdx + 1;
        setCurrentIdx(next);
        audioRefs.current[next].currentTime = 0;
        playTimeoutRef.current = setTimeout(() => { audioRefs.current[next].play(); setIsPlaying(true); }, 1000);
      } else { setIsPlaying(false); }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    updateGradient(items[currentIdx]);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [currentIdx, items, updateGradient]);

  const getAudio = useCallback(() => audioRefs.current[currentIdx] ?? null, [currentIdx]);
  const { seekBarRef, onSeekDown, pct } = useSeekBar({ getAudio, duration, currentTime });
  const activeSubLine = useSubtitles(items[currentIdx]?.timeline || [], currentTime);

  const togglePlay = () => { const a = audioRefs.current[currentIdx]; if (a?.src) a.paused ? a.play() : a.pause(); };
  const switchTrack = (idx: number) => {
    if (idx < 0 || idx >= items.length || idx === currentIdx) return;
    audioRefs.current[currentIdx]?.pause();
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    setCurrentIdx(idx);
    const next = audioRefs.current[idx];
    if (next?.src) { next.currentTime = 0; playTimeoutRef.current = setTimeout(() => next.play(), 600); }
  };

  const currentItem = items[currentIdx];
  const categoryColor = CATEGORY_COLORS[currentItem?.category] || "#f59e0b";
  const bannerImage = currentItem?.image_url || "";
  const thumbnailImage = currentItem?.thumbnail_url || "";
  const sourceDomain = (() => { try { return new URL(currentItem?.source_link || "").hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const favIcon = buildFaviconUrl(sourceDomain);

  if (loading) {
    return <NewsSkeleton />;
  }

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-black">
      <BackButton />
      <MediaOverlay imageUrl={bannerImage} gradientColor={gradientColor} />

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top spacer — background image breathes */}
        <div className="flex-1 min-h-0" />

        {/* Category badge */}
        {currentItem?.category && (
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: categoryColor, color: "#fff" }}>
              {currentItem.category}
            </span>
          </div>
        )}

        {/* Rolling CC subtitle */}
        {showCaptions && (
          <div className="flex-shrink-0 px-6 mb-2">
            <div className="max-w-lg mx-auto text-center min-h-[52px] flex flex-col items-center justify-end">
              {activeSubLine ? (
                <>
                  <span className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${activeSubLine.speaker === "female" ? "text-pink-400/70" : "text-blue-400/70"}`}>
                    {activeSubLine.speaker === "female" ? "Liza" : "Lix"}
                  </span>
                  <p key={`${activeSubLine.start}-${activeSubLine.text.slice(0,20)}`} className="text-sm text-white/85 font-medium leading-snug animate-[fadeUp_0.25s_ease-out]">
                    {activeSubLine.text}
                  </p>
                </>
              ) : (
                <p key={currentIdx} className="text-sm text-white/60 font-medium leading-snug animate-[fadeUp_0.3s_ease-out]">
                  {loading ? headline : (currentItem?.topic || headline)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ PLAYER ═══ */}
        <div className="flex-shrink-0 px-4 pb-6 pt-2">
          <div className="max-w-lg mx-auto rounded-3xl px-6 py-5 bg-black/30 backdrop-blur-md border border-white/[0.06]">
            {/* Title + Source row */}
            <div className="flex items-center gap-4 mb-4">
              {/* Mini thumbnail */}
              {(thumbnailImage || bannerImage) && (
                <div className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0 border border-white/10 shadow-lg" style={{ backgroundImage: `url(${thumbnailImage || bannerImage})` }} />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white/90 truncate">{currentItem?.topic || headline}</h2>
                <div className="flex items-center gap-1.5">
                  {favIcon && sourceDomain ? (
                    <a href={currentItem?.source_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 group">
                      <img src={favIcon} alt="" width={12} height={12} className="rounded-sm opacity-40 group-hover:opacity-70" />
                      <span className="text-[10px] text-white/30 group-hover:text-white/50 uppercase tracking-wider">{sourceDomain}</span>
                    </a>
                  ) : <span className="text-[10px] text-white/20 italic">Elixpo Daily</span>}
                </div>
              </div>
              {/* CC + counter */}
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  showCaptions ? "bg-white/15 border-white/20 text-white/80" : "bg-transparent border-white/8 text-white/25 hover:text-white/45"
                }`}
              >CC</button>
              <span className="text-[10px] text-white/30 font-mono">{currentIdx + 1}/{items.length}</span>
            </div>

            {/* 7 category tile seek bars */}
            <div className="flex gap-1 mb-3">
              {items.map((item, idx) => {
                const isActive = idx === currentIdx;
                const color = CATEGORY_COLORS[item.category] || "#666";
                return (
                  <button
                    key={idx}
                    onClick={() => switchTrack(idx)}
                    className="flex-1 h-1.5 rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden"
                    style={{ background: isActive ? "rgba(255,255,255,0.15)" : `${color}33` }}
                    title={`${item.category}: ${item.topic?.slice(0, 50)}`}
                  >
                    {isActive ? (
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-100" style={{ width: `${pct}%`, background: color }} />
                    ) : (
                      <div className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.5 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main seek bar */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] text-white/30 font-mono w-9 text-right">{formatTime(currentTime)}</span>
              <div ref={seekBarRef} onMouseDown={onSeekDown} onTouchStart={onSeekDown} className="flex-1 h-1 rounded-full cursor-pointer relative group hover:h-1.5 transition-all" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, background: categoryColor }} />
                <div className="absolute w-3 h-3 rounded-full bg-white -top-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${pct}% - 6px)` }} />
              </div>
              <span className="text-[10px] text-white/30 font-mono w-9">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => switchTrack(currentIdx - 1)} disabled={currentIdx === 0} className="text-white/40 hover:text-white/70 active:scale-90 transition-all cursor-pointer p-2 rounded-full hover:bg-white/[0.06] disabled:opacity-20">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></svg>
              </button>

              <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-white/10">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button onClick={() => switchTrack(currentIdx + 1)} disabled={currentIdx === items.length - 1} className="text-white/40 hover:text-white/70 active:scale-90 transition-all cursor-pointer p-2 rounded-full hover:bg-white/[0.06] disabled:opacity-20">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
