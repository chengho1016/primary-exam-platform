import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="system-state-page">
        <section className="system-state-card">
          <span className="system-state-code">404</span>
          <p className="eyebrow">找不到頁面</p>
          <h1>呢一頁可能已經搬走。</h1>
          <p>網址可能有誤，或者內容暫時未公開。你可以返首頁，或者直接去試卷庫。</p>
          <div className="system-state-actions">
            <ButtonLink href="/">返回首頁</ButtonLink>
            <ButtonLink href="/papers" variant="secondary">瀏覽試卷庫</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
