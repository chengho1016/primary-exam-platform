import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "聯絡我們" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section contact-hero-section">
          <div className="container contact-layout contact-layout-upgraded">
            <div>
              <SectionHeading eyebrow="Contact" title="想試用、購買或開通會員？" description="直接電郵我們，講低想開通的方案、孩子年級及聯絡方式；確認後會為你開通帳戶。" />
              <div className="contact-card contact-card-upgraded">
                <h3>客服電郵</h3>
                <p>{siteConfig.supportEmail}</p>
                <ButtonLink href={`mailto:${siteConfig.supportEmail}?subject=考試吧會員開通查詢`}>發送查詢</ButtonLink>
              </div>
            </div>
            <aside className="form-panel contact-runbook contact-runbook-upgraded">
              <h2>開通流程</h2>
              <ol>
                <li><strong>選方案</strong><span>月費「考試之星」或年費「考試之王」。</span></li>
                <li><strong>發電郵</strong><span>留下註冊電郵、孩子年級及想開通的方案。</span></li>
                <li><strong>完成開通</strong><span>確認後會收到回覆，重新登入即可使用。</span></li>
              </ol>
              <div className="contact-plan-grid" aria-label="方案提示">
                <div><strong>$128/月</strong><span>考試之星</span></div>
                <div><strong>$300/年</strong><span>考試之王</span></div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
