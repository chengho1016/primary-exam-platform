import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "私隱政策｜小學堂" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="container legal-card">
          <p className="eyebrow">Privacy</p>
          <h1>私隱政策</h1>
          <p>小學堂只收集提供學習服務所需的基本資料，包括登入電郵、家長/孩子名稱、年級、練習紀錄、錯題紀錄、列印授權及會籍狀態。</p>
          <h2>我們如何使用資料</h2>
          <ul><li>用作登入、會員權限、試卷練習、錯題追蹤及家長報告。</li><li>管理員操作會寫入 AdminAuditLog，方便追查帳戶、試卷及權限變更。</li><li>不會出售會員或孩子資料。</li></ul>
          <h2>資料保安</h2>
          <ul><li>密碼以 bcrypt hash 儲存，不保存明文密碼。</li><li>管理後台需 ADMIN 角色才可進入。</li><li>列印試卷會加入會員與授權水印。</li></ul>
          <h2>查詢</h2>
          <p>如需查閱、更正或刪除帳戶資料，可電郵 {siteConfig.supportEmail}。</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
