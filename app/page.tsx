"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("company_logo");
    if (saved) setLogoUrl(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("current_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } else {
      setError("Kullanıcı adı veya şifre hatalı.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #080D1A 0%, #0F1729 50%, #080D1A 100%)" }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />

      <div className="relative w-full max-w-md px-4">
        {/* Logo area */}
        <div className="mb-8">
          {logoUrl ? (
            <div className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ height: 180, background: "rgba(15,23,41,0.8)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <img src={logoUrl} alt="logo" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold gradient-text">Teknovateknik</h1>
              <p className="text-sm mt-1" style={{ color: "#7A90B8" }}>İletişim Merkezi Yönetim Paneli</p>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "rgba(15, 23, 41, 0.95)",
            border: "1px solid rgba(37,99,235,0.15)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(37,99,235,0.05)",
          }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: "#E8F0FF" }}>Hoş Geldiniz</h2>
          <p className="text-sm mb-7" style={{ color: "#7A90B8" }}>Devam etmek için hesabınıza giriş yapın</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3D5278" }}>
                Kullanıcı Adı
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <svg style={{ position: "absolute", left: 12, pointerEvents: "none", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5278" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  required
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, outline: "none", background: "#080D1A", border: "1px solid #1E2D4A", color: "#E8F0FF", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#1E2D4A"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "#3D5278" }}>
                Şifre
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <svg style={{ position: "absolute", left: 12, pointerEvents: "none", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5278" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 44, paddingTop: 12, paddingBottom: 12, borderRadius: 12, fontSize: 14, outline: "none", background: "#080D1A", border: "1px solid #1E2D4A", color: "#E8F0FF", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#1E2D4A"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, background: "none", border: "none", cursor: "pointer", color: "#3D5278", display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-2"
              style={{
                background: loading ? "rgba(37,99,235,0.4)" : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(37,99,235,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#3D5278" }}>
          © 2025 Teknovateknik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
