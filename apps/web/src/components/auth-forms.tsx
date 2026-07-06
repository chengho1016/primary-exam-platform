"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = {};
const grades = [1, 2, 3, 4, 5, 6] as const;

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
      <div className="form-meta"><span>安全登入後保持30日</span><span>忘記密碼功能稍後開放</span></div>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "登入中…" : "登入帳戶"}</button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);
  const [childCount, setChildCount] = useState(1);

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
