"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAction, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = {};
const grades = [1, 2, 3, 4, 5, 6] as const;
const CODE_LENGTH = 6;

function RequiredStar() {
  return <span className="required-star" aria-label="必填">*</span>;
}

function GradeSelect({ id, name, defaultValue = "4" }: { id: string; name: string; defaultValue?: string }) {
  return (
    <select id={id} name={name} defaultValue={defaultValue}>
      {grades.map((grade) => <option value={grade} key={grade}>小{grade}</option>)}
    </select>
  );
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="form-stack">
      <div className="field"><label htmlFor="email">電郵地址</label><input autoComplete="email" id="email" name="email" type="email" placeholder="parent@example.com" required /></div>
      <div className="field"><label htmlFor="password">密碼</label><input autoComplete="current-password" id="password" name="password" type="password" placeholder="最少8個字元" required /></div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "登入中…" : "登入帳戶"}</button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);
  const [childCount, setChildCount] = useState(1);
  const router = useRouter();

  // ── Verification step state ──
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Determine current step: if server action returned step="verify", switch to verify UI
  const step = state.step ?? "register";

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmitCode = useCallback(async (currentCode: string) => {
    if (currentCode.length !== CODE_LENGTH) return;

    setIsVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, code: currentCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setVerifyError(data.error || "驗證失敗");
        setCode("");
        setIsVerifying(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
    } catch {
      setVerifyError("網絡錯誤，請檢查連線後再試");
      setIsVerifying(false);
    }
  }, [state.email, router]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(val);
    if (val.length === CODE_LENGTH && !isVerifying) {
      handleSubmitCode(val);
    }
  };

  const handleResend = async () => {
    if (isResending || countdown > 0) return;

    setIsResending(true);
    setResendMessage("");
    setVerifyError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, action: "resend" }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setVerifyError(data.error || "重發失敗");
        setIsResending(false);
        return;
      }

      setResendMessage("已重新發送驗證碼");
      setCountdown(60);
      setCode("");
      setIsResending(false);
    } catch {
      setVerifyError("網絡錯誤，請檢查連線後再試");
      setIsResending(false);
    }
  };

  // ── VERIFICATION STEP UI ──
  if (step === "verify") {
    return (
      <div className="auth-card">
        <h2>輸入驗證碼</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
          已發送到 <strong>{state.email}</strong>
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
              disabled={isVerifying}
            />
          </div>

          {verifyError ? (
            <p className="form-error" role="alert">{verifyError}</p>
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
            <button
              type="button"
              className="button button-text"
              onClick={() => window.location.reload()}
            >
              ← 返回註冊
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── REGISTRATION FORM STEP ──
  return (
    <form action={action} className="form-stack register-form-upgraded">
      <div className="field"><label htmlFor="name">家長稱呼<RequiredStar /></label><input id="name" name="name" placeholder="例如：陳太" required /></div>
      <div className="field"><label htmlFor="register-email">電郵地址<RequiredStar /></label><input autoComplete="email" id="register-email" name="email" type="email" placeholder="parent@example.com" required /></div>
      <div className="field"><label htmlFor="phone-number">電話號碼<RequiredStar /></label><input autoComplete="tel" id="phone-number" inputMode="tel" name="phoneNumber" placeholder="例如：9123 4567" required /></div>

      <div className="child-register-panel">
        <div className="child-register-head">
          <div><strong>小朋友資料<RequiredStar /></strong><span>可即時加入最多 3 位小朋友。</span></div>
          {childCount < 3 ? <button className="button button-secondary button-small" onClick={() => setChildCount((count) => Math.min(3, count + 1))} type="button">＋ 加多一位</button> : null}
        </div>
        {Array.from({ length: childCount }, (_, index) => {
          const childNumber = index + 1;
          return (
            <div className="field-row child-register-row" key={childNumber}>
              <div className="field"><label htmlFor={`child-name-${childNumber}`}>小朋友名稱{childNumber === 1 ? <RequiredStar /> : null}</label><input id={`child-name-${childNumber}`} name={`childName${childNumber}`} placeholder={childNumber === 1 ? "樂言" : `第 ${childNumber} 位小朋友`} required={childNumber === 1} /></div>
              <div className="field"><label htmlFor={`grade-${childNumber}`}>年級{childNumber === 1 ? <RequiredStar /> : null}</label><GradeSelect id={`grade-${childNumber}`} name={`grade${childNumber}`} /></div>
            </div>
          );
        })}
      </div>

      <div className="field"><label htmlFor="register-password">設定密碼<RequiredStar /></label><input autoComplete="new-password" id="register-password" name="password" type="password" placeholder="最少8字元，包含英文字母及數字" required /></div>
      <label className="checkbox form-meta"><input type="checkbox" required />我同意服務條款及私隱政策</label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "發送驗證碼中…" : "發送驗證碼"}</button>
    </form>
  );
}
