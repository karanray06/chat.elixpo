"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import PollinationsBadge from "../chat/PollinationsBadge";
import { TEXT_MODELS, type Model, type Tier } from "@/lib/pollinations";

interface HeaderBarProps {
  model?: string;
  onModelChange?: (model: string) => void;
}

export function HeaderBar({ model, onModelChange }: HeaderBarProps) {
  const pathname = usePathname();
  const [showPicker, setShowPicker] = useState(false);

  const isChat = pathname?.startsWith("/chat");
  const currentModel = TEXT_MODELS.find((m) => m.id === model) || TEXT_MODELS[0];

  const groupedModels = TEXT_MODELS.reduce((acc, m) => {
    if (!acc[m.tier]) acc[m.tier] = [];
    acc[m.tier].push(m);
    return acc;
  }, {} as Record<Tier, Model[]>);

  const tierColors: Record<Tier, string> = {
    FREE: "text-emerald-400",
    PRO: "text-amber-400",
    MAX: "text-violet-400",
  };

  const pageName = pathname?.startsWith("/chat")
    ? "Chat"
    : pathname?.startsWith("/search")
    ? "Search"
    : pathname?.startsWith("/news")
    ? "News"
    : pathname?.startsWith("/podcast")
    ? "Podcast"
    : pathname?.startsWith("/discover")
    ? "Weather"
    : "";

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-[rgba(240,237,230,0.08)] bg-[#0a0a0a] sticky top-0 z-10 text-[#f0ede6]">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-[rgba(240,237,230,0.4)] hover:text-[#f0ede6] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase text-[rgba(240,237,230,0.4)] flex items-center gap-2">
          <span>Elixpo</span>
          <span className="text-[rgba(240,237,230,0.2)]">/</span>
          <span className="text-[#f0ede6]">{pageName}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex">
          <PollinationsBadge />
        </div>

        {isChat && model && onModelChange && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-[0.05em] uppercase text-[rgba(240,237,230,0.6)] hover:text-[#f0ede6] hover:bg-[rgba(240,237,230,0.04)] transition-colors cursor-pointer border border-[rgba(240,237,230,0.1)]"
            >
              <span>{currentModel.name}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a2e] rounded-xl shadow-2xl border border-[rgba(240,237,230,0.1)] z-50 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                  {(["FREE", "PRO", "MAX"] as Tier[]).map((tier) => (
                    <div key={tier} className="mb-2 last:mb-0">
                      <div className="px-4 py-1.5 flex items-center gap-2">
                        <span className={`text-[10px] font-bold tracking-widest ${tierColors[tier]}`}>
                          {tier} TIER
                        </span>
                        <div className="h-px flex-1 bg-[rgba(240,237,230,0.08)]" />
                      </div>
                      {groupedModels[tier]?.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onModelChange(m.id);
                            setShowPicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                            model === m.id
                              ? "bg-[rgba(240,237,230,0.06)]"
                              : "hover:bg-[rgba(240,237,230,0.04)]"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className={`font-medium truncate ${model === m.id ? "text-[#f0ede6]" : "text-[rgba(240,237,230,0.6)]"}`}>
                              {m.name}
                            </p>
                            <p className="text-[10px] text-[rgba(240,237,230,0.3)] truncate">{m.description}</p>
                          </div>
                          {model === m.id && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" className="shrink-0" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
