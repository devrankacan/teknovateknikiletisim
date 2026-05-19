"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { mockConversations, mockStats, MOCK_USER } from "@/lib/mockData";
import { Conversation, Message, Platform } from "@/lib/types";
import { formatTime, formatFullTime } from "@/lib/auth";
import PlatformIcon from "@/components/PlatformIcon";
import {
  Search,
  Send,
  LogOut,
  BarChart2,
  MessageSquare,
  CheckCheck,
  Clock,
  Filter,
  ChevronDown,
  Smile,
  Paperclip,
  MoreVertical,
  Bell,
  Users,
  TrendingUp,
  X,
  Check,
  Circle,
} from "lucide-react";

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

export default function DashboardPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("auth");
    if (!auth) router.push("/");
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  const filteredConversations = conversations.filter((c) => {
    const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch =
      search === "" ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()) ||
      c.customerHandle.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  function selectConversation(id: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              unreadCount: 0,
              messages: c.messages.map((m) => ({ ...m, read: true })),
            }
          : c
      )
    );
    setSelectedId(id);
  }

  function sendMessage() {
    if (!messageInput.trim() || !selectedId) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedId,
      content: messageInput.trim(),
      sender: "agent",
      timestamp: new Date(),
      status: "sent",
      read: true,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: newMsg.content,
              lastMessageTime: newMsg.timestamp,
              messages: [...c.messages, newMsg],
              status: "active",
            }
          : c
      )
    );
    setMessageInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
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

  function resolveConversation(id: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c))
    );
  }

  function logout() {
    sessionStorage.removeItem("auth");
    router.push("/");
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const platformColor = {
    whatsapp: "#25D366",
    instagram: "#E1306C",
    messenger: "#0084FF",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0f13" }}>
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="flex flex-col w-80 flex-shrink-0" style={{ background: "#13131f", borderRight: "1px solid #1e1e2a" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e2a" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #6c63ff, #a855f7)" }}
            >
              TT
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "#f0f0f5" }}>
                Teknovateknik
              </div>
              <div className="text-xs" style={{ color: "#555570" }}>İletişim Merkezi</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: showStats ? "#6c63ff" : "#555570" }}
              title="İstatistikler"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "#555570" }}
              title="Bildirimler"
            >
              <Bell className="w-4 h-4" />
              {totalUnread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                  style={{ background: "#6c63ff", padding: "0 3px" }}
                >
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats panel */}
        {showStats && (
          <div className="px-4 py-3 grid grid-cols-2 gap-2" style={{ borderBottom: "1px solid #1e1e2a" }}>
            {[
              { label: "Toplam Mesaj", value: mockStats.totalMessages, icon: <MessageSquare className="w-3.5 h-3.5" />, color: "#6c63ff" },
              { label: "Aktif Konuşma", value: mockStats.activeConversations, icon: <Users className="w-3.5 h-3.5" />, color: "#25D366" },
              { label: "Bugün Çözüldü", value: mockStats.resolvedToday, icon: <CheckCheck className="w-3.5 h-3.5" />, color: "#f59e0b" },
              { label: "Ort. Yanıt", value: mockStats.avgResponseTime, icon: <Clock className="w-3.5 h-3.5" />, color: "#0084FF" },
            ].map((s) => (
              <div key={s.label} className="p-2.5 rounded-xl" style={{ background: "#1e1e28", border: "1px solid #2a2a3a" }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[10px] font-medium" style={{ color: "#555570" }}>{s.label}</span>
                </div>
                <div className="font-bold text-base" style={{ color: "#f0f0f5" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#555570" }} />
            <input
              type="text"
              placeholder="Konuşma ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "#0f0f13",
                border: "1px solid #2a2a3a",
                color: "#f0f0f5",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6c63ff")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a3a")}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#555570" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Platform filter */}
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {PLATFORM_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setPlatformFilter(f.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: platformFilter === f.value ? "rgba(108,99,255,0.2)" : "#1e1e28",
                color: platformFilter === f.value ? "#6c63ff" : "#8888a4",
                border: `1px solid ${platformFilter === f.value ? "rgba(108,99,255,0.4)" : "#2a2a3a"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="px-4 pb-3 flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: statusFilter === f.value ? "rgba(108,99,255,0.15)" : "transparent",
                color: statusFilter === f.value ? "#6c63ff" : "#555570",
                border: `1px solid ${statusFilter === f.value ? "rgba(108,99,255,0.3)" : "transparent"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs" style={{ color: "#555570" }}>
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              Konuşma bulunamadı
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className="w-full text-left px-4 py-3.5 transition-all relative"
                style={{
                  background: selectedId === conv.id ? "rgba(108,99,255,0.08)" : "transparent",
                  borderLeft: selectedId === conv.id ? "2px solid #6c63ff" : "2px solid transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `${platformColor[conv.platform]}20`,
                        color: platformColor[conv.platform],
                        border: `1.5px solid ${platformColor[conv.platform]}30`,
                      }}
                    >
                      {conv.customerAvatar}
                    </div>
                    {/* Platform dot */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "#13131f", border: "1.5px solid #13131f" }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: platformColor[conv.platform] }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm truncate" style={{ color: "#f0f0f5" }}>
                        {conv.customerName}
                      </span>
                      <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "#555570" }}>
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate pr-2" style={{ color: "#8888a4" }}>
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 ? (
                        <span
                          className="flex-shrink-0 min-w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ background: "#6c63ff", padding: "0 5px" }}
                        >
                          {conv.unreadCount}
                        </span>
                      ) : conv.status === "resolved" ? (
                        <CheckCheck className="flex-shrink-0 w-3.5 h-3.5" style={{ color: "#555570" }} />
                      ) : null}
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background:
                            conv.status === "active"
                              ? "rgba(34,197,94,0.1)"
                              : conv.status === "pending"
                              ? "rgba(245,158,11,0.1)"
                              : "rgba(85,85,112,0.15)",
                          color:
                            conv.status === "active"
                              ? "#22c55e"
                              : conv.status === "pending"
                              ? "#f59e0b"
                              : "#555570",
                        }}
                      >
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
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid #1e1e2a" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6c63ff, #a855f7)" }}
            >
              {MOCK_USER.avatar}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: "#f0f0f5" }}>{MOCK_USER.name}</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                <span className="text-[10px]" style={{ color: "#555570" }}>Çevrimiçi</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#555570" }}
            title="Çıkış yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ===== MAIN CHAT AREA ===== */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: "#13131f", borderBottom: "1px solid #1e1e2a" }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: `${platformColor[selectedConversation.platform]}20`,
                      color: platformColor[selectedConversation.platform],
                      border: `1.5px solid ${platformColor[selectedConversation.platform]}30`,
                    }}
                  >
                    {selectedConversation.customerAvatar}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                    style={{ background: platformColor[selectedConversation.platform], border: "2px solid #13131f" }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: "#f0f0f5" }}>
                      {selectedConversation.customerName}
                    </span>
                    <PlatformIcon platform={selectedConversation.platform} size={14} showLabel />
                  </div>
                  <div className="text-xs" style={{ color: "#8888a4" }}>
                    {selectedConversation.customerHandle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedConversation.status !== "resolved" && (
                  <button
                    onClick={() => resolveConversation(selectedConversation.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "#22c55e",
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Çözüldü İşaretle
                  </button>
                )}
                <button className="p-2 rounded-lg" style={{ color: "#555570" }}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              style={{ background: "#0f0f13" }}
            >
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: "#1e1e2a" }} />
                <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: "#16161d", color: "#555570", border: "1px solid #1e1e2a" }}>
                  Bugün
                </span>
                <div className="flex-1 h-px" style={{ background: "#1e1e2a" }} />
              </div>

              {selectedConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "customer" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 self-end mb-0.5"
                      style={{
                        background: `${platformColor[selectedConversation.platform]}20`,
                        color: platformColor[selectedConversation.platform],
                      }}
                    >
                      {selectedConversation.customerAvatar.slice(0, 1)}
                    </div>
                  )}
                  <div className={`max-w-md ${msg.sender === "agent" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={
                        msg.sender === "agent"
                          ? {
                              background: "linear-gradient(135deg, #6c63ff 0%, #7c5cbf 100%)",
                              color: "white",
                              borderBottomRightRadius: 6,
                              boxShadow: "0 2px 8px rgba(108,99,255,0.25)",
                            }
                          : {
                              background: "#1e1e28",
                              color: "#f0f0f5",
                              border: "1px solid #2a2a3a",
                              borderBottomLeftRadius: 6,
                            }
                      }
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px]" style={{ color: "#555570" }}>
                        {formatFullTime(msg.timestamp)}
                      </span>
                      {msg.sender === "agent" && (
                        <CheckCheck
                          className="w-3 h-3"
                          style={{ color: msg.status === "read" ? "#6c63ff" : "#555570" }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
              className="px-6 py-4 flex-shrink-0"
              style={{ background: "#13131f", borderTop: "1px solid #1e1e2a" }}
            >
              {selectedConversation.status === "resolved" ? (
                <div
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                  style={{ background: "#1e1e28", color: "#555570", border: "1px solid #2a2a3a" }}
                >
                  <CheckCheck className="w-4 h-4" />
                  Bu konuşma çözüldü olarak işaretlenmiştir
                </div>
              ) : (
                <div
                  className="flex items-end gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "#0f0f13", border: "1px solid #2a2a3a" }}
                >
                  <button className="mb-0.5" style={{ color: "#555570" }}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`${selectedConversation.customerName}'e mesaj yaz...`}
                    rows={1}
                    className="flex-1 resize-none text-sm bg-transparent"
                    style={{
                      color: "#f0f0f5",
                      height: 44,
                      maxHeight: 120,
                      lineHeight: "1.5",
                      paddingTop: 10,
                    }}
                  />
                  <button className="mb-0.5" style={{ color: "#555570" }}>
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: messageInput.trim()
                        ? "linear-gradient(135deg, #6c63ff, #7c5cbf)"
                        : "#1e1e28",
                      color: messageInput.trim() ? "white" : "#555570",
                      boxShadow: messageInput.trim() ? "0 2px 12px rgba(108,99,255,0.35)" : "none",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-[10px] mt-2 text-center" style={{ color: "#555570" }}>
                Enter ile gönder · Shift+Enter yeni satır
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4" style={{ color: "#555570" }}>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.15)" }}
            >
              <MessageSquare className="w-10 h-10" style={{ color: "#6c63ff", opacity: 0.5 }} />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1" style={{ color: "#8888a4" }}>Konuşma seçin</p>
              <p className="text-sm">Sol taraftan bir konuşma seçerek başlayın</p>
            </div>
          </div>
        )}
      </main>

      {/* ===== RIGHT PANEL ===== */}
      {selectedConversation && (
        <aside
          className="w-64 flex-shrink-0 flex flex-col"
          style={{ background: "#13131f", borderLeft: "1px solid #1e1e2a" }}
        >
          {/* Customer info */}
          <div className="p-5" style={{ borderBottom: "1px solid #1e1e2a" }}>
            <div className="flex flex-col items-center text-center mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-3"
                style={{
                  background: `${platformColor[selectedConversation.platform]}15`,
                  color: platformColor[selectedConversation.platform],
                  border: `2px solid ${platformColor[selectedConversation.platform]}30`,
                }}
              >
                {selectedConversation.customerAvatar}
              </div>
              <div className="font-semibold text-sm mb-0.5" style={{ color: "#f0f0f5" }}>
                {selectedConversation.customerName}
              </div>
              <div className="text-xs mb-3" style={{ color: "#8888a4" }}>
                {selectedConversation.customerHandle}
              </div>
              <PlatformIcon platform={selectedConversation.platform} size={14} showLabel />
            </div>

            <div className="space-y-2">
              <InfoRow label="Platform" value={
                selectedConversation.platform === "whatsapp" ? "WhatsApp"
                : selectedConversation.platform === "instagram" ? "Instagram"
                : "Messenger"
              } />
              <InfoRow label="Durum" value={
                selectedConversation.status === "active" ? "Aktif"
                : selectedConversation.status === "pending" ? "Bekliyor"
                : "Çözüldü"
              } valueColor={
                selectedConversation.status === "active" ? "#22c55e"
                : selectedConversation.status === "pending" ? "#f59e0b"
                : "#555570"
              } />
              <InfoRow label="Mesaj Sayısı" value={String(selectedConversation.messages.length)} />
            </div>
          </div>

          {/* Tags */}
          <div className="p-5" style={{ borderBottom: "1px solid #1e1e2a" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555570" }}>
              Etiketler
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedConversation.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.2)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Replies */}
          <div className="p-5 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#555570" }}>
              Hızlı Yanıtlar
            </div>
            <div className="space-y-2">
              {[
                "Merhaba! Size nasıl yardımcı olabiliriz?",
                "Ürünlerimiz hakkında detaylı bilgi için web sitemizi ziyaret edebilirsiniz.",
                "Teknik destek ekibimiz en kısa sürede sizinle iletişime geçecektir.",
                "Teşekkür ederiz, iyi günler dileriz!",
              ].map((reply) => (
                <button
                  key={reply}
                  onClick={() => setMessageInput(reply)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: "#1e1e28",
                    border: "1px solid #2a2a3a",
                    color: "#8888a4",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#252532";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(108,99,255,0.3)";
                    (e.currentTarget as HTMLElement).style.color = "#f0f0f5";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#1e1e28";
                    (e.currentTarget as HTMLElement).style.borderColor = "#2a2a3a";
                    (e.currentTarget as HTMLElement).style.color = "#8888a4";
                  }}
                >
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

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs" style={{ color: "#555570" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: valueColor ?? "#8888a4" }}>{value}</span>
    </div>
  );
}
