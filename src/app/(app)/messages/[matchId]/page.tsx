"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/providers/locale-provider";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  moderationStatus: string;
};

export default function ConversationPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${matchId}`);
    const json = await res.json();
    if (res.ok) setMessages(json.data);
  }, [matchId]);

  useEffect(() => {
    void load();
    void fetch("/api/profiles")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data) setMe(j.data.userId);
      });
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [matchId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    setSending(false);
    if (!res.ok) {
      toast.error(json.error || t("messages.blockedContent"));
      return;
    }
    setContent("");
    setMessages((prev) => [...prev, json.data]);
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-8rem)] max-w-2xl flex-col md:h-[calc(100svh-4rem)]">
      <h1 className="mb-4 font-display text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
        {t("messages.title")}
      </h1>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-emerald-100/80 bg-white/70 p-4 dark:border-emerald-900 dark:bg-slate-950/60">
        {messages.map((m) => {
          const mine = me != null && m.senderId === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-50 text-slate-800 dark:bg-emerald-950 dark:text-slate-100"
                }`}
              >
                {m.content}
                {mine && m.isRead && (
                  <div className="mt-1 text-[10px] opacity-80">Read</div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("messages.placeholder")}
          className="min-h-[52px] flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button onClick={() => void send()} disabled={sending} className="self-end">
          {t("messages.send")}
        </Button>
      </div>
    </div>
  );
}
