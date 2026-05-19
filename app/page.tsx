"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      style={{ background: "linear-gradient(135deg, #0f0f13 0%, #13131f 50%, #0f0f13 100%)" }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)" }}
        />
      </div>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#6c63ff 1px, transparent 1px), linear-gradient(90deg, #6c63ff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative w-full max-w-md px-4">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #6c63ff 0%, #a855f7 100%)" }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-1 gradient-text">Teknovateknik</h1>
          <p className="text-sm" style={{ color: "#8888a4" }}>
            İletişim Merkezi Yönetim Paneli
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(22, 22, 29, 0.95)",
            border: "1px solid rgba(108,99,255,0.15)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(108,99,255,0.05)",
          }}
        >
          <h2 className="text-xl font-semibold mb-1" style={{ color: "#f0f0f5" }}>
            Hoş Geldiniz
          </h2>
          <p className="text-sm mb-7" style={{ color: "#8888a4" }}>
            Devam etmek için hesabınıza giriş yapın
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#555570" }}>
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#555570" }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici_adi"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "#0f0f13",
                    border: "1px solid #2a2a3a",
                    color: "#f0f0f5",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6c63ff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#2a2a3a";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#555570" }}>
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#555570" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm"
                  style={{
                    background: "#0f0f13",
                    border: "1px solid #2a2a3a",
                    color: "#f0f0f5",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6c63ff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#2a2a3a";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#555570" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-2"
              style={{
                background: loading
                  ? "rgba(108,99,255,0.4)"
                  : "linear-gradient(135deg, #6c63ff 0%, #7c5cbf 100%)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(108,99,255,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
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

          {/* Hint */}
          <div className="mt-6 pt-5 text-xs text-center" style={{ borderTop: "1px solid #1e1e2a", color: "#555570" }}>
            Demo: <span style={{ color: "#8888a4" }}>admin</span> / <span style={{ color: "#8888a4" }}>teknovateknik2025</span>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#555570" }}>
          © 2025 Teknovateknik. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
