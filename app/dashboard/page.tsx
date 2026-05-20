"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Platform } from "@/lib/types";
import { formatTime, formatFullTime } from "@/lib/auth";
import PlatformIcon from "@/components/PlatformIcon";
import {
  Search, Send, LogOut, BarChart2, MessageSquare, CheckCheck,
  Clock, MoreVertical, Bell, Users, X, Check, Paperclip, Smile, Camera, ArrowLeft, Archive, ArchiveRestore,
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

// ===== EMOJI DATA =====
const EMOJI_CATEGORIES = [
  {
    label: "😀 Yüzler",
    emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡"],
  },
  {
    label: "👍 Jestler",
    emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅"],
  },
  {
    label: "❤️ Semboller",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","✡️","🔯","🕎","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸"],
  },
  {
    label: "🎉 Objeler",
    emojis: ["🎉","🎊","🎈","🎁","🎀","🎗","🎟","🎫","🎖","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑","🏏","⛳","🏹","🎣","🤿","🥊","🥋","🎽","⛸","🛷","🎿","⛷","🏂","🪂","🏋","🤼","🤸","⛹","🤺","🏇","🧘","🧗"],
  },
];

const STATUS_FILTERS = [
  { label: "Tümü", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Bekleyen", value: "pending" },
];

const platformColor: Record<string, string> = {
  whatsapp: "#25D366",
  instagram: "#E1306C",
  messenger: "#0084FF",
};

const WA_SVG = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IG_SVG = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none" />
  </svg>
);
const MSG_SVG = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0084FF">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.671V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26 5.887-3.26-6.559 6.863z" />
  </svg>
);

const PLATFORM_FILTERS: { label: string; value: Platform | "all"; icon: (s: number) => React.ReactNode; color: string; bg: string; border: string }[] = [
  {
    label: "Tümü", value: "all", color: "var(--text-primary)", bg: "var(--surface-raised)", border: "var(--border)",
    icon: (s) => (
      <div className="flex -space-x-1.5">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.15)" }}>{WA_SVG(12)}</div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(225,48,108,0.15)" }}>{IG_SVG(12)}</div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,132,255,0.15)" }}>{MSG_SVG(12)}</div>
      </div>
    ),
  },
  { label: "WhatsApp", value: "whatsapp", color: "#25D366", bg: "rgba(37,211,102,0.08)", border: "rgba(37,211,102,0.2)", icon: (s) => WA_SVG(s) },
  { label: "Instagram", value: "instagram", color: "#E1306C", bg: "rgba(225,48,108,0.08)", border: "rgba(225,48,108,0.2)", icon: (s) => IG_SVG(s) },
  { label: "Messenger", value: "messenger", color: "#0084FF", bg: "rgba(0,132,255,0.08)", border: "rgba(0,132,255,0.2)", icon: (s) => MSG_SVG(s) },
];

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => {
    fetch("/api/logo").then(r => r.json()).then(data => {
      if (data.dataUrl) setLogoUrl(data.dataUrl);
    });
  }, []);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setLogoUrl(base64);
      await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
    };
    reader.readAsDataURL(file);
  }

  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<DBConversation | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; avatar: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<{ previewUrl: string; url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  useEffect(() => {
    const u = sessionStorage.getItem("current_user");
    if (!u) { router.push("/"); return; }
    setCurrentUser(JSON.parse(u));
  }, [router]);

  const fetchConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (platformFilter !== "all") params.set("platform", platformFilter);
    if (showArchive) {
      params.set("status", "archived");
    } else {
      params.set("excludeStatus", "archived");
      if (statusFilter !== "all") params.set("status", statusFilter);
    }
    if (search) params.set("search", search);
    const res = await fetch(`/api/conversations?${params}`);
    if (res.status === 401) { router.push("/"); return; }
    const data: DBConversation[] = await res.json();
    setConversations(data);
    setLoadingConvs(false);
  }, [platformFilter, statusFilter, showArchive, search, router]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!showStats) return;
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, [showStats]);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    sseRef.current = es;
    es.addEventListener("new_message", (e) => {
      const data = JSON.parse(e.data) as { conversationId: string; message: DBMessage; conversation?: DBConversation };
      setSelectedConv((prev) => {
        if (prev?.id === data.conversationId) {
          setMessages((msgs) => [...msgs, data.message]);
          return prev;
        }
        return prev;
      });
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === data.conversationId);
        if (exists) {
          return prev.map((c) =>
            c.id === data.conversationId
              ? { ...c, unreadCount: data.message.sender === "customer" ? c.unreadCount + 1 : c.unreadCount, updatedAt: new Date().toISOString() }
              : c
          );
        }
        fetchConversations();
        return prev;
      });
    });
    return () => es.close();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showEmojiPicker]);

  async function selectConversation(conv: DBConversation) {
    setSelectedConv(conv);
    setShowMobileChat(true);
    const res = await fetch(`/api/conversations/${conv.id}`);
    const full: DBConversation = await res.json();
    setMessages(full.messages ?? []);
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)));
  }

  async function sendMessage() {
    if ((!messageInput.trim() && !selectedFile) || !selectedConv || sending || uploading) return;
    if (selectedFile && !selectedFile.url) return; // upload still in progress
    setSending(true);
    const content = messageInput.trim();
    const fileToSend = selectedFile;
    setMessageInput("");
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    const body: Record<string, string> = { conversationId: selectedConv.id, content };
    if (fileToSend) body.attachmentUrl = fileToSend.url;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const msg: DBMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConv.id ? { ...c, updatedAt: new Date().toISOString() } : c)
      );
    }
    setSending(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Immediate local preview via blob URL
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({ previewUrl, url: "", name: file.name });
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setSelectedFile((prev) => prev ? { ...prev, url } : null);
    } else {
      setSelectedFile(null);
      URL.revokeObjectURL(previewUrl);
    }
    setUploading(false);
    e.target.value = "";
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setMessageInput((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? messageInput.length;
    const end = ta.selectionEnd ?? messageInput.length;
    const newValue = messageInput.slice(0, start) + emoji + messageInput.slice(end);
    setMessageInput(newValue);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      ta.selectionStart = start + emoji.length;
      ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape") setShowEmojiPicker(false);
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessageInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function archiveConversation(id: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedConv?.id === id) { setSelectedConv(null); setShowMobileChat(false); }
  }

  async function unarchiveConversation(id: string) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedConv?.id === id) { setSelectedConv(null); setShowMobileChat(false); }
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
      <aside
        className="flex-col flex-shrink-0"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border-subtle)",
          width: isNarrow ? "100vw" : "min(400px, 400px)",
          display: isNarrow && showMobileChat ? "none" : "flex",
        }}
      >
        {/* Header — tam genişlik logo + altında ikonlar */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {/* Logo alanı — tam genişlik */}
          <button
            onClick={() => logoInputRef.current?.click()}
            className="relative w-full group overflow-hidden"
            style={{
              height: 140,
              background: logoUrl ? "transparent" : "linear-gradient(135deg, var(--accent) 0%, #60A5FA 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Logo yüklemek için tıkla"
          >
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12 }} />
              : <span className="font-bold text-white select-none" style={{ fontSize: 48, letterSpacing: 4, opacity: 0.9 }}>TT</span>
            }
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
                <Camera style={{ width: 18, height: 18, color: "white" }} />
                <span className="text-white text-sm font-medium">Logo Yükle</span>
              </div>
            </div>
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

          {/* Action icons — yatay sıra */}
          <div className="flex items-center justify-around px-2 py-2">
            <button onClick={() => setShowStats(!showStats)} className="p-2 rounded-lg"
              style={{ color: showStats ? "var(--accent)" : "var(--text-muted)" }} title="İstatistikler">
              <BarChart2 style={{ width: 18, height: 18 }} />
            </button>
            <button className="relative p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
              <Bell style={{ width: 18, height: 18 }} />
              {totalUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: "var(--accent)", fontSize: 9, padding: "0 3px" }}>{totalUnread}</span>
              )}
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg"
              style={{ color: "var(--text-muted)" }} title={theme === "dark" ? "Gündüz modu" : "Gece modu"}>
              {theme === "dark"
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <button onClick={logout} className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }} title="Çıkış yap">
              <LogOut style={{ width: 18, height: 18 }} />
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

        {/* Platform filter — vertical icons */}
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          {PLATFORM_FILTERS.map((f) => {
            const active = platformFilter === f.value;
            return (
              <button key={f.value} onClick={() => setPlatformFilter(f.value)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: active ? f.bg : "transparent",
                  border: `1px solid ${active ? f.border : "transparent"}`,
                  color: active ? f.color : "var(--text-secondary)",
                }}>
                <span className="flex-shrink-0">{f.icon(20)}</span>
                <span>{f.label}</span>
                {active && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: f.color }} />}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
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
                      style={{ background: platformColor[conv.platform], border: "2px solid var(--surface)" }}>
                      {conv.platform === "whatsapp" && <span className="flex items-center justify-center w-full h-full">{WA_SVG(8)}</span>}
                      {conv.platform === "instagram" && <span className="flex items-center justify-center w-full h-full">{IG_SVG(8)}</span>}
                      {conv.platform === "messenger" && <span className="flex items-center justify-center w-full h-full">{MSG_SVG(8)}</span>}
                    </div>
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

        {/* Archive toggle */}
        <button
          onClick={() => { setShowArchive(!showArchive); setSelectedConv(null); setShowMobileChat(false); }}
          className="flex items-center gap-2.5 px-4 py-3 w-full transition-colors"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            background: showArchive ? "var(--accent-light)" : "transparent",
            color: showArchive ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <Archive style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span className="text-xs font-medium">Arşiv</span>
        </button>

        {/* User footer */}
        <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent), #60A5FA)" }}>
            {currentUser?.avatar ?? "TT"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{currentUser?.name ?? "Teknovateknik"}</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Çevrimiçi</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CHAT ===== */}
      <main
        className="flex-col flex-1 overflow-hidden"
        style={{ display: !isNarrow || showMobileChat ? "flex" : "none" }}
      >
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => { setShowMobileChat(false); }}
                  className="p-2 rounded-lg md:hidden"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: `${platformColor[selectedConv.platform]}20`,
                      color: platformColor[selectedConv.platform],
                      border: `1.5px solid ${platformColor[selectedConv.platform]}30`,
                    }}>
                    {selectedConv.customerAvatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: platformColor[selectedConv.platform], border: "2px solid var(--surface)" }}>
                    {selectedConv.platform === "whatsapp" && WA_SVG(7)}
                    {selectedConv.platform === "instagram" && IG_SVG(7)}
                    {selectedConv.platform === "messenger" && MSG_SVG(7)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{selectedConv.customerName}</span>
                    <PlatformIcon platform={selectedConv.platform} size={13} showLabel />
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{selectedConv.customerHandle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status === "archived" ? (
                  <button onClick={() => unarchiveConversation(selectedConv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "var(--accent)" }}>
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Geri Al</span>
                  </button>
                ) : (
                  <button onClick={() => archiveConversation(selectedConv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                    <Archive className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Arşivle</span>
                  </button>
                )}
                <button className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ background: "var(--bg)" }}>
              <div className="flex items-center gap-3 my-2">
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
                  <div className={`max-w-xs sm:max-w-md flex flex-col ${msg.sender === "agent" ? "items-end" : "items-start"}`}>
                    {(() => {
                      const isImg = msg.content.startsWith("/api/uploads/") || msg.content.startsWith("/uploads/");
                      return (
                        <div className={isImg ? "rounded-2xl overflow-hidden" : "px-4 py-2.5 rounded-2xl text-sm leading-relaxed"}
                          style={msg.sender === "agent"
                            ? { background: isImg ? "transparent" : "linear-gradient(135deg, var(--accent), #1D4ED8)", color: "white", borderBottomRightRadius: 6, boxShadow: isImg ? "none" : "0 2px 8px rgba(37,99,235,0.25)" }
                            : { background: isImg ? "transparent" : "var(--surface-raised)", color: "var(--text-primary)", border: isImg ? "none" : "1px solid var(--border)", borderBottomLeftRadius: 6 }}>
                          {isImg ? (
                            <img src={msg.content} alt="" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 12, display: "block" }} />
                          ) : msg.content}
                        </div>
                      );
                    })()}
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
            <div className="px-4 py-4 flex-shrink-0" style={{ background: "var(--surface)", borderTop: "1px solid var(--border-subtle)" }}>
              {/* File preview */}
              {selectedFile && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                  <img src={selectedFile.previewUrl} alt={selectedFile.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    style={{ border: "1px solid var(--border)" }} />
                  <span className="flex-1 text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {selectedFile.name}
                  </span>
                  <button onClick={() => setSelectedFile(null)}
                    className="flex-shrink-0 p-1 rounded-full"
                    style={{ color: "var(--text-muted)", background: "var(--surface)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Emoji picker popup */}
              <div className="relative">
                {showEmojiPicker && (
                  <div ref={emojiPickerRef}
                    className="absolute bottom-full mb-2 left-0 rounded-2xl shadow-xl z-50 overflow-hidden"
                    style={{
                      width: 320,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                    }}>
                    {/* Category tabs */}
                    <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                      {EMOJI_CATEGORIES.map((cat, i) => (
                        <button key={i} onClick={() => setEmojiCategory(i)}
                          className="flex-1 py-2 text-xs font-medium transition-colors"
                          style={{
                            background: emojiCategory === i ? "var(--accent-light)" : "transparent",
                            color: emojiCategory === i ? "var(--accent)" : "var(--text-muted)",
                            borderBottom: emojiCategory === i ? "2px solid var(--accent)" : "2px solid transparent",
                          }}>
                          {cat.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    {/* Emoji grid */}
                    <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                      {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
                        <button key={i} onClick={() => insertEmoji(emoji)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-colors hover:bg-[var(--surface-raised)]"
                          title={emoji}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mb-0.5 hidden sm:block transition-colors"
                    style={{ color: uploading ? "var(--accent)" : "var(--text-muted)" }}
                    title="Resim ekle">
                    {uploading
                      ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Paperclip className="w-4 h-4" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <textarea ref={textareaRef} value={messageInput}
                    onChange={handleTextareaChange} onKeyDown={handleKeyDown}
                    placeholder={`${selectedConv.customerName}'e mesaj yaz...`}
                    rows={1} className="flex-1 resize-none text-sm bg-transparent"
                    style={{ color: "var(--text-primary)", height: 44, maxHeight: 120, lineHeight: "1.5", paddingTop: 10 }} />
                  <button
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    className="mb-0.5 hidden sm:block transition-colors"
                    style={{ color: showEmojiPicker ? "var(--accent)" : "var(--text-muted)" }}
                    title="Emoji ekle">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button onClick={sendMessage} disabled={(!messageInput.trim() && !selectedFile) || sending || uploading || (!!selectedFile && !selectedFile.url)}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: (messageInput.trim() || selectedFile?.url) && !sending && !uploading ? "linear-gradient(135deg, var(--accent), #1D4ED8)" : "var(--surface-raised)",
                      color: (messageInput.trim() || selectedFile?.url) && !sending && !uploading ? "white" : "var(--text-muted)",
                      boxShadow: (messageInput.trim() || selectedFile?.url) && !uploading ? "0 2px 12px rgba(37,99,235,0.35)" : "none",
                    }}>
                    {sending
                      ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-[10px] mt-2 text-center hidden sm:block" style={{ color: "var(--text-muted)" }}>
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

      {/* ===== RIGHT PANEL — desktop only ===== */}
      {selectedConv && (
        <aside className="hidden md:flex w-72 flex-shrink-0 flex-col" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border-subtle)" }}>
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
