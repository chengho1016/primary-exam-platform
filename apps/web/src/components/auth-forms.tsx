"use client";

import { useActionState } from "react";
import { loginAction, registerAction, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="form-stack">
      <div className="field"><label htmlFor="email">電郵地址</label><input autoComplete="email" id="email" name="email" type="email" placeholder="parent@example.com" required /></div>
      <div className="field"><label htmlFor="password">密碼</label><input autoComplete="current-password" id="password" name="password" type="password" placeholder="最少8個字元" required /></div>
      <div className="form-meta"><span>安全登入後保持30日</span><span>忘記密碼功能稍後開放</span></div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "登入中…" : "登入帳戶"}</button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="form-stack">
      <div className="field"><label htmlFor="name">家長稱呼</label><input id="name" name="name" placeholder="例如：陳太" required /></div>
      <div className="field"><label htmlFor="register-email">電郵地址</label><input autoComplete="email" id="register-email" name="email" type="email" placeholder="parent@example.com" required /></div>
      <div className="field-row">
        <div className="field"><label htmlFor="child-name">小朋友名稱</label><input id="child-name" name="childName" placeholder="樂言" required /></div>
        <div className="field"><label htmlFor="grade">年級</label><select id="grade" name="grade" defaultValue="4"><option value="1">小一</option><option value="2">小二</option><option value="3">小三</option><option value="4">小四</option><option value="5">小五</option><option value="6">小六</option></select></div>
      </div>
      <div className="field"><label htmlFor="register-password">設定密碼</label><input autoComplete="new-password" id="register-password" name="password" type="password" placeholder="最少8字元，包含英文字母及數字" required /></div>
      <label className="checkbox form-meta"><input type="checkbox" required />我同意服務條款及私隱政策</label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "建立中…" : "建立帳戶"}</button>
    </form>
  );
}
