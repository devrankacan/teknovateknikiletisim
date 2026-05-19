"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Platform } from "@/lib/types";
import { formatTime, formatFullTime } from "@/lib/auth";
import PlatformIcon from "@/components/PlatformIcon";
import {
  Search, Send, LogOut, BarChart2, MessageSquare, CheckCheck,
  Clock, MoreVertical, Bell, Users, X, Check, Paperclip, Smile,
} from "lucide-react";

type DBMessage = {
  id: string;
  conversationId: string;
  content: string;
  sender: "customer" | "agent";
  status: string;
  read: boolean;
  createdAt: string;
};

type DBConversation = {
  id: string;
  platform: Platform;
  customerName: string;
  customerHandle: string;
  customerAvatar: string;
  status: string;
  unreadCount: number;
  tags: string;
  platformUserId: string | null;
  updatedAt: string;
  messages?: DBMessage[];
};

type Stats = {
  totalMessages: number;
  activeConversations: number;
  resolvedToday: number;
  avgResponseTime: string;
};

const PLATFORM_FILTERS: { label: string; value: Platform | "all" }[] = [
  { label: "Tümü", value: "all" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "Messenger", value: "messenger" },
];

const STATUS_FILTERS = [
  { label: "Tümü", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Bekleyen", value: "pending" },
  { label: "Çözüldü", value: "resolved" },
];

const platformColor: Record<string, string> = {
  whatsapp: "#25D366",
  instagram: "#E1306C",
  messenger: "#0084FF",
};

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<DBConversation | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; avatar: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Auth check
  useEffect(() => {
    const u = sessionStorage.getItem("current_user");
    if (!u) { router.push("/"); return; }
    setCurrentUser(JSON.parse(u));
  }, [router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/conversations?${params}`);
    if (res.status === 401) { router.push("/"); return; }
    const data: DBConversation[] = await res.json();
    setConversations(data);
    setLoadingConvs(false);
  }, [platformFilter, statusFilter, search, router]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch stats
  useEffect(() => {
    if (!showStats) return;
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, [showStats]);

  // SSE for real-time updates
  useEffect(() => {
    const es = new EventSource("/api/sse");
    sseRef.current = es;

    es.addEventListener("new_message", (e) => {
      const data = JSON.parse(e.data) as { conversationId: string; message: DBMessage; conversation?: DBConversation };

      // Eğer bu konuşma açıksa mesajı ekle
      setSelectedConv((prev) => {
        if (prev?.id === data.conversationId) {
          setMessages((msgs) => [...msgs, data.message]);
          return prev;
        }
        return prev;
      });

      // Konuşma listesini güncelle
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === data.conversationId);
        if (exists) {
          return prev.map((c) =>
            c.id === data.conversationId
              ? {
                  ...c,
                  unreadCount: data.message.sender === "customer" ? c.unreadCount + 1 : c.unreadCount,
                  updatedAt: new Date().toISOString(),
                }
              : c
          );
        }
        // Yeni konuşmayı yeniden çek
        fetchConversations();
        return prev;
      });
    });

    return () => es.close();
  }, [fetchConversations]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function selectConversation(conv: DBConversation) {
    setSelectedConv(conv);
    const res = await fetch(`/api/conversations/${conv.id}`);
    const full: DBConversation = await res.json();
    setMessages(full.messages ?? []);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedConv || sending) return;
    setSending(true);
    const content = messageInput.trim();
    setMessageInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConv.id, content }),
    });

    if (res.ok) {
      const msg: DBMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? { ...c, updatedAt: new Date().toISOString() } : c
        )
      );
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessageInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function resolveConversation(id: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c))
    );
    if (selectedConv?.id === id) setSelectedConv((p) => p ? { ...p, status: "resolved" } : p);
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    sessionStorage.clear();
    router.push("/");
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="flex flex-col w-96 flex-shrink-0" style={{ background: "var(--surface)", borderRight: "1px solid var(--border-subtle)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), #60A5FA)" }}>TT</div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Teknovateknik</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>İletişim Merkezi</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowStats(!showStats)} className="p-2 rounded-lg"
              style={{ color: showStats ? "var(--accent)" : "var(--text-muted)" }} title="İstatistikler">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button className="relative p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
              <Bell className="w-4 h-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  style={{ background: "var(--accent)", padding: "0 3px" }}>{totalUnread}</span>
              )}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              title={theme === "dark" ? "Gündüz modu" : "Gece modu"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && (
          <div className="px-4 py-3 grid grid-cols-2 gap-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {[
              { label: "Toplam Mesaj", value: stats.totalMessages, icon: <MessageSquare className="w-3.5 h-3.5" />, color: "var(--accent)" },
              { label: "Aktif", value: stats.activeConversations, icon: <Users className="w-3.5 h-3.5" />, color: "#25D366" },
              { label: "Bugün Çözüldü", value: stats.resolvedToday, icon: <CheckCheck className="w-3.5 h-3.5" />, color: "#f59e0b" },
              { label: "Ort. Yanıt", value: stats.avgResponseTime, icon: <Clock className="w-3.5 h-3.5" />, color: "#0084FF" },
            ].map((s) => (
              <div key={s.label} className="p-2.5 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                </div>
                <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Konuşma ara..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Platform filter */}
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {PLATFORM_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setPlatformFilter(f.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: platformFilter === f.value ? "var(--accent-light)" : "var(--surface-raised)",
                color: platformFilter === f.value ? "var(--accent)" : "var(--text-secondary)",
                border: `1px solid ${platformFilter === f.value ? "rgba(37,99,235,0.4)" : "var(--border)"}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="px-4 pb-3 flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: statusFilter === f.value ? "var(--accent-light)" : "transparent",
                color: statusFilter === f.value ? "var(--accent)" : "var(--text-muted)",
                border: `1px solid ${statusFilter === f.value ? "rgba(37,99,235,0.3)" : "transparent"}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-24">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs" style={{ color: "var(--text-muted)" }}>
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              Konuşma bulunamadı
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className="w-full text-left px-5 py-4 transition-all relative"
                style={{
                  background: selectedConv?.id === conv.id ? "var(--accent-light)" : "transparent",
                  borderLeft: selectedConv?.id === conv.id ? "2px solid var(--accent)" : "2px solid transparent",
                }}>
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `${platformColor[conv.platform]}20`,
                        color: platformColor[conv.platform],
                        border: `1.5px solid ${platformColor[conv.platform]}30`,
                      }}>
                      {conv.customerAvatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                      style={{ background: platformColor[conv.platform], border: "2px solid var(--surface)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {conv.customerName}
                      </span>
                      <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                        {formatTime(new Date(conv.updatedAt))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate pr-2" style={{ color: "var(--text-secondary)" }}>
                        {conv.messages?.[0]?.content ?? "—"}
                      </span>
                      {conv.unreadCount > 0 ? (
                        <span className="flex-shrink-0 min-w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ background: "var(--accent)", padding: "0 5px" }}>
                          {conv.unreadCount}
                        </span>
                      ) : conv.status === "resolved" ? (
                        <CheckCheck className="flex-shrink-0 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      ) : null}
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: conv.status === "active" ? "rgba(34,197,94,0.1)" : conv.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(61,82,120,0.15)",
                          color: conv.status === "active" ? "#22c55e" : conv.status === "pending" ? "#f59e0b" : "var(--text-muted)",
                        }}>
                        {conv.status === "active" ? "Aktif" : conv.status === "pending" ? "Bekliyor" : "Çözüldü"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* User footer */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), #60A5FA)" }}>
              {currentUser?.avatar ?? "TT"}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{currentUser?.name ?? "Teknovateknik"}</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Çevrimiçi</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }} title="Çıkış yap">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ===== MAIN CHAT ===== */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: `${platformColor[selectedConv.platform]}20`,
                      color: platformColor[selectedConv.platform],
                      border: `1.5px solid ${platformColor[selectedConv.platform]}30`,
                    }}>
                    {selectedConv.customerAvatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                    style={{ background: platformColor[selectedConv.platform], border: "2px solid var(--surface)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{selectedConv.customerName}</span>
                    <PlatformIcon platform={selectedConv.platform} size={14} showLabel />
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{selectedConv.customerHandle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status !== "resolved" && (
                  <button onClick={() => resolveConversation(selectedConv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
                    <Check className="w-3.5 h-3.5" />
                    Çözüldü İşaretle
                  </button>
                )}
                <button className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5" style={{ background: "var(--bg)" }}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <span className="text-[10px] px-3 py-1 rounded-full"
                  style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                  Konuşma
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "customer" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 self-end mb-0.5"
                      style={{ background: `${platformColor[selectedConv.platform]}20`, color: platformColor[selectedConv.platform] }}>
                      {selectedConv.customerAvatar.slice(0, 1)}
                    </div>
                  )}
                  <div className={`max-w-md flex flex-col ${msg.sender === "agent" ? "items-end" : "items-start"}`}>
                    <div className="px-5 py-3 rounded-2xl text-sm leading-relaxed"
                      style={msg.sender === "agent"
                        ? { background: "linear-gradient(135deg, var(--accent), #1D4ED8)", color: "white", borderBottomRightRadius: 6, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }
                        : { background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 6 }}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {formatFullTime(new Date(msg.createdAt))}
                      </span>
                      {msg.sender === "agent" && (
                        <CheckCheck className="w-3 h-3" style={{ color: msg.status === "read" ? "var(--accent)" : "var(--text-muted)" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-5 flex-shrink-0" style={{ background: "var(--surface)", borderTop: "1px solid var(--border-subtle)" }}>
              {selectedConv.status === "resolved" ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                  style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  <CheckCheck className="w-4 h-4" />
                  Bu konuşma çözüldü olarak işaretlendi
                </div>
              ) : (
                <div className="flex items-end gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <button className="mb-0.5" style={{ color: "var(--text-muted)" }}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <textarea ref={textareaRef} value={messageInput}
                    onChange={handleTextareaChange} onKeyDown={handleKeyDown}
                    placeholder={`${selectedConv.customerName}'e mesaj yaz...`}
                    rows={1} className="flex-1 resize-none text-sm bg-transparent"
                    style={{ color: "var(--text-primary)", height: 44, maxHeight: 120, lineHeight: "1.5", paddingTop: 10 }} />
                  <button className="mb-0.5" style={{ color: "var(--text-muted)" }}>
                    <Smile className="w-4 h-4" />
                  </button>
                  <button onClick={sendMessage} disabled={!messageInput.trim() || sending}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: messageInput.trim() && !sending ? "linear-gradient(135deg, var(--accent), #1D4ED8)" : "var(--surface-raised)",
                      color: messageInput.trim() && !sending ? "white" : "var(--text-muted)",
                      boxShadow: messageInput.trim() ? "0 2px 12px rgba(37,99,235,0.35)" : "none",
                    }}>
                    {sending
                      ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <div className="text-[10px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
                Enter ile gönder · Shift+Enter yeni satır
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4" style={{ color: "var(--text-muted)" }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-light)", border: "1px solid rgba(37,99,235,0.15)" }}>
              <MessageSquare className="w-10 h-10" style={{ color: "var(--accent)", opacity: 0.5 }} />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Konuşma seçin</p>
              <p className="text-sm">Sol taraftan bir konuşma seçerek başlayın</p>
            </div>
          </div>
        )}
      </main>

      {/* ===== RIGHT PANEL ===== */}
      {selectedConv && (
        <aside className="w-72 flex-shrink-0 flex flex-col" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border-subtle)" }}>
          <div className="p-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3"
                style={{
                  background: `${platformColor[selectedConv.platform]}15`,
                  color: platformColor[selectedConv.platform],
                  border: `2px solid ${platformColor[selectedConv.platform]}30`,
                }}>
                {selectedConv.customerAvatar}
              </div>
              <div className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{selectedConv.customerName}</div>
              <div className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{selectedConv.customerHandle}</div>
              <PlatformIcon platform={selectedConv.platform} size={14} showLabel />
            </div>
            <div className="space-y-2">
              <InfoRow label="Platform" value={selectedConv.platform.charAt(0).toUpperCase() + selectedConv.platform.slice(1)} />
              <InfoRow label="Durum"
                value={selectedConv.status === "active" ? "Aktif" : selectedConv.status === "pending" ? "Bekliyor" : "Çözüldü"}
                valueColor={selectedConv.status === "active" ? "#22c55e" : selectedConv.status === "pending" ? "#f59e0b" : "var(--text-muted)"} />
              <InfoRow label="Mesaj Sayısı" value={String(messages.length)} />
            </div>
          </div>

          <div className="p-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Etiketler</div>
            <div className="flex flex-wrap gap-1.5">
              {(JSON.parse(selectedConv.tags || "[]") as string[]).map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid rgba(37,99,235,0.2)" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Hızlı Yanıtlar</div>
            <div className="space-y-2">
              {[
                "Merhaba! Size nasıl yardımcı olabiliriz?",
                "Ürünlerimiz için web sitemizi ziyaret edebilirsiniz.",
                "Teknik destek ekibimiz sizinle iletişime geçecektir.",
                "Teşekkür ederiz, iyi günler dileriz!",
              ].map((reply) => (
                <button key={reply} onClick={() => setMessageInput(reply)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,99,235,0.3)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }}>
                  {reply.length > 60 ? reply.slice(0, 60) + "…" : reply}
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: valueColor ?? "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}
