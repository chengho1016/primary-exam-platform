import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "服務條款｜小學堂" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="container legal-card">
          <p className="eyebrow">Terms</p>
          <h1>服務條款</h1>
          <p>使用小學堂即表示你同意以下條款。本平台提供小學試卷練習、列印、錯題追蹤及家長報告工具，內容只供學習用途。</p>
          <h2>帳戶與會員</h2>
          <ul><li>家長需確保登入資料安全，不應分享帳戶。</li><li>會員權限、列印額度及有效期以後台記錄為準。</li><li>如發現濫用、轉售或大量下載，平台可暫停帳戶。</li></ul>
          <h2>試卷與列印</h2>
          <ul><li>列印檔案會加入水印和授權編號。</li><li>試卷內容可能會持續修正，管理員會逐步覆核題目及答案。</li></ul>
          <h2>支援</h2>
          <p>如遇登入、付款、列印或題目問題，請聯絡 {siteConfig.supportEmail}。</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
