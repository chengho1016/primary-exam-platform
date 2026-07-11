"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="system-state-page">
      <section className="system-state-card" role="alert">
        <span className="system-state-code">!</span>
        <p className="eyebrow">暫時載入唔到</p>
        <h1>網站遇到短暫問題。</h1>
        <p>你可以再試一次；如果仍然未能開啟，請返回首頁稍後再試。</p>
        <div className="system-state-actions">
          <button className="button button-primary" onClick={reset} type="button">重新載入</button>
          <Link className="button button-secondary" href="/">返回首頁</Link>
        </div>
      </section>
    </main>
  );
}
