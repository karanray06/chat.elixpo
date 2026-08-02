"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useBookmarks } from "@/lib/chat/use-bookmarks";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import { ChatSearchDialog } from "@/components/chat/ChatSearchDialog";
import { BookmarkedMessagesPanel } from "@/components/chat/BookmarkedMessagesPanel";
import ChatSkeleton from "@/components/skeletons/ChatSkeleton";
import { useModel } from "../ModelContext";

const SUGGESTION_CHIPS = [
  { label: "BRAINSTORM IDEAS", prompt: "Help me brainstorm ideas for " },
  { label: "WRITE SOMETHING", prompt: "Help me write " },
  { label: "RESEARCH A TOPIC", prompt: "Research and summarize " },
  { label: "HELP WITH CODE", prompt: "Help me write code for " },
];

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { model, setModel } = useModel();

  const [sessionId] = useState(() => id === "new" ? crypto.randomUUID().slice(0, 11) : id);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { messages, sendMessage, stop, status, setMessages, regenerate } = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { model, id: sessionId },
    }),
    onFinish: () => {
      if (id === "new") {
        window.history.replaceState(null, "", `/chat/${sessionId}`);
      }
    }
  });

  const isLoading = status === "streaming" || status === "submitted";

  const displayMessages = messages.map((msg: any) => ({
    ...msg,
    content: msg.content ?? (msg.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || ""),
  }));

  const sendMessageWrapper = (content: string, images?: string[]) => {
    sendMessage({ role: "user", parts: [{ type: "text", text: content }] } as any);
  };

  const { toggleBookmark, isBookmarked, getBookmarkedMessages } = useBookmarks();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (id !== "new") {
      setIsLoadingHistory(true);
      fetch(`/api/chat?id=${id}`)
        .then(res => {
          if (!res.ok) throw new Error(`Chat history fetch failed: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(err => console.error("Failed to load chat history:", err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [id, setMessages]);

  useEffect(() => {
    if (id === "new" && sessionId && displayMessages.length > 0) {
      router.replace(`/chat/${sessionId}`, { scroll: false });
    }
  }, [sessionId, id, router, displayMessages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const prevLoading = useRef(false);
  useEffect(() => {
    if (prevLoading.current && !isLoading) {
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
      textarea?.focus();
    }
    prevLoading.current = isLoading;
  }, [isLoading]);

  const handleSelectSearchResult = (messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element && scrollRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-blue-400");
      setTimeout(() => element.classList.remove("ring-2", "ring-blue-400"), 2000);
    }
  };

  const handleDelete = async () => {
    if (!sessionId || !confirm("Are you sure you want to delete this chat permanently?")) return;
    try {
      await fetch(`/api/chat/conversations?id=${sessionId}`, { method: "DELETE" });
      router.replace("/chat/new");
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[rgba(240,237,230,0.2)] border-t-[#6366f1] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-4xl font-bold uppercase tracking-wider text-[#0a0a0a] bg-[#f0ede6] px-3 py-1 mb-6">
          Elixpo
        </div>
        <h2 className="text-2xl font-bold text-[#f0ede6] mb-2">Sign in to chat</h2>
        <p className="text-[rgba(240,237,230,0.5)] text-sm text-center max-w-sm mb-6">
          Connect with your Elixpo account to start conversations.
        </p>
        <button
          onClick={login}
          className="px-8 py-3 text-sm font-semibold bg-[#6366f1] text-[#f0ede6] hover:bg-[#5b5bd6] transition-colors cursor-pointer"
          style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
        >
          Sign in with Elixpo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatSearchDialog
        messages={displayMessages as any}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      <BookmarkedMessagesPanel
        messages={getBookmarkedMessages()}
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onRemoveBookmark={(messageId) => {
          const msg = displayMessages.find((m) => m.id === messageId);
          if (msg) toggleBookmark(msg as any);
        }}
        onSelectMessage={handleSelectSearchResult}
      />

      {/* Toolbar for active chats */}
      {displayMessages.length > 0 && (
        <div className="flex items-center justify-end gap-1 px-4 py-1.5 border-b border-[rgba(240,237,230,0.05)] shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+Shift+F)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider text-[rgba(240,237,230,0.4)] hover:text-[#f0ede6] hover:bg-[rgba(240,237,230,0.04)] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={() => setBookmarksOpen(true)}
            title="Bookmarks"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider text-[rgba(240,237,230,0.4)] hover:text-[#f0ede6] hover:bg-[rgba(240,237,230,0.04)] transition-colors cursor-pointer relative"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">Bookmarks</span>
            {getBookmarkedMessages().length > 0 && (
              <span className="absolute top-1 right-0 w-2 h-2 bg-[#6366f1] rounded-full" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[rgba(240,237,230,0.4)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8" style={{ scrollbarWidth: "thin" }}>
        {isLoadingHistory ? (
          <ChatSkeleton />
        ) : (
          <div className="max-w-3xl mx-auto space-y-7">
            {displayMessages.length === 0 && !isLoadingHistory && (
              <div className="flex flex-col items-center justify-center pt-[18vh]">
                <h1 className="text-4xl md:text-5xl font-bold text-[#f0ede6] mb-12 text-center leading-tight">
                  What can I help<br />you with?
                </h1>
              </div>
            )}
            {displayMessages.map((msg, i) => {
              const isLastAssistant = msg.role === "assistant" && i === displayMessages.length - 1;
              const isLastLoading = isLoading && isLastAssistant;
              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    if (el) messageRefs.current[msg.id] = el;
                  }}
                  id={`msg-${msg.id}`}
                  className={`${msg.role === "user" ? "animate-msg-user" : "animate-msg-assistant"} rounded-lg transition-all`}
                >
                  <MessageBubble
                    message={{ ...msg, isStreaming: isLastLoading } as any}
                    onRetry={isLastAssistant && !isLoading ? regenerate : undefined}
                    isBookmarked={isBookmarked(msg.id)}
                    onToggleBookmark={() => toggleBookmark(msg as any)}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      <ChatInput onSend={sendMessageWrapper} onStop={stop} isLoading={isLoading} model={model} onModelChange={setModel} />

      {/* Suggestion chips (only on empty state) */}
      {displayMessages.length === 0 && !isLoadingHistory && (
        <div className="flex flex-wrap justify-center gap-3 px-4 pb-4 -mt-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessageWrapper(chip.prompt)}
              className="px-5 py-2.5 text-[11px] font-mono font-bold tracking-[0.05em] uppercase text-[rgba(240,237,230,0.5)] border border-[rgba(240,237,230,0.1)] hover:border-[rgba(240,237,230,0.25)] hover:text-[#f0ede6] hover:bg-[rgba(240,237,230,0.04)] transition-all cursor-pointer"
              style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {displayMessages.length === 0 && (
        <p className="text-[10px] text-[rgba(240,237,230,0.25)] text-center pb-4 font-mono">
          Elixpo can make mistakes. Consider checking important information.
        </p>
      )}
    </div>
  );
}
