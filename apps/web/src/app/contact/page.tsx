import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "聯絡我們｜小學堂" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container contact-layout">
            <div>
              <SectionHeading eyebrow="Contact" title="想試用、購買或開通會員？" description="早期商業化階段先採用人工開通：收到家長查詢後，管理員可以在後台即時設定會籍、方案和列印額度。" />
              <div className="contact-card">
                <h3>客服電郵</h3>
                <p>{siteConfig.supportEmail}</p>
                <ButtonLink href={`mailto:${siteConfig.supportEmail}?subject=小學堂會員開通查詢`}>發送查詢</ButtonLink>
              </div>
            </div>
            <aside className="form-panel contact-runbook">
              <h2>開通流程</h2>
              <ol>
                <li>家長選擇方案並聯絡客服。</li>
                <li>管理員到「會員管理」建立或搜尋帳戶。</li>
                <li>設定會籍為 ACTIVE、方案名稱及列印額度。</li>
                <li>家長重新登入後即可使用會員內容。</li>
              </ol>
              <p>之後接入自動付款時，這套流程可直接變成後台 fallback。</p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
