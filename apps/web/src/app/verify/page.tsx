import { Suspense } from "react";
import { VerifyContent } from "./verify-content";

export const metadata = { title: "驗證電郵" };

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="auth-page">
        <aside className="auth-aside" />
        <section className="auth-main">
          <div className="auth-card">
            <h2>載入中…</h2>
          </div>
        </section>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
