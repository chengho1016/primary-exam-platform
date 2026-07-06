"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

const CODE_LENGTH = 6;

export function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = useCallback(async (currentCode: string) => {
    if (currentCode.length !== CODE_LENGTH) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: currentCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "驗證失敗");
        setCode("");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
    } catch {
      setError("網絡錯誤，請檢查連線後再試");
      setIsSubmitting(false);
    }
  }, [email, router]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(val);
    // Auto-submit when 6 digits entered
    if (val.length === CODE_LENGTH && !isSubmitting) {
      handleSubmit(val);
    }
  };

  const handleResend = async () => {
    if (isResending || countdown > 0) return;

    setIsResending(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "resend" }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "重發失敗");
        setIsResending(false);
        return;
      }

      setResendMessage("已重新發送驗證碼");
      setCountdown(60);
      setCode("");
      setIsResending(false);
    } catch {
      setError("網絡錯誤，請檢查連線後再試");
      setIsResending(false);
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="brand" href="/">
          <span className="brand-mark"><BookIcon /></span>{siteConfig.name}
        </Link>
        <div className="auth-aside-copy">
          <h1>最後一步 — 驗證電郵。</h1>
          <p>我們已向你的電郵發送驗證碼，請輸入以完成註冊。</p>
        </div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <h2>輸入驗證碼</h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            已發送到 <strong>{email}</strong>
          </p>

          <div className="form-stack">
            <div className="field">
              <label htmlFor="code">6 位驗證碼</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={CODE_LENGTH}
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                style={{
                  fontSize: "28px",
                  letterSpacing: "12px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
                disabled={isSubmitting}
              />
            </div>

            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : null}
            {resendMessage ? (
              <p style={{ color: "#2e7d32", fontSize: "13px", textAlign: "center" }}>
                {resendMessage}
              </p>
            ) : null}

            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <button
                type="button"
                className="button button-text"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
              >
                {countdown > 0
                  ? `重新發送（${countdown}s）`
                  : isResending
                    ? "發送中…"
                    : "沒有收到？重新發送"}
              </button>
            </div>

            <p className="auth-switch">
              <Link href="/register">← 返回註冊</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
