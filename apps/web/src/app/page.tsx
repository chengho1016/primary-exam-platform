import { ArrowRightIcon, PaperIcon, PrinterIcon, ShieldIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";

const features = [
  { title: "先預覽", description: "睇清楚年級、科目、頁數同題量，避免印錯卷。", icon: PaperIcon, tone: "blue" },
  { title: "再列印", description: "完整輸出 A4 試卷，方便孩子按正式測驗節奏完成。", icon: PrinterIcon, tone: "mint" },
  { title: "有水印", description: "每次列印加入會員資料，保護試卷資源。", icon: ShieldIcon, tone: "coral" },
] as const;

const steps = [
  { title: "揀年級", description: "小一至小六，快速篩選孩子可用試卷。" },
  { title: "揀科目", description: "中文、英文、數學、人文、科學。" },
  { title: "預覽列印", description: "確認內容後，一鍵產生水印列印版。" },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero commercial-hero clean-home-hero">
          <div className="container hero-grid clean-hero-grid">
            <div className="hero-copy redesign-hero-copy">
              <p className="eyebrow">香港小學生試卷平台</p>
              <h1>揀卷、預覽、列印，一頁完成。</h1>
              <p>考試吧幫家長快速找到合適試卷，預覽內容後直接列印紙本。簡單、清楚，適合日常溫習同考前操卷。</p>
              <div className="hero-actions">
                <ButtonLink href="/papers">瀏覽試卷庫<ArrowRightIcon /></ButtonLink>
                <ButtonLink href="/register" variant="secondary">免費建立帳戶</ButtonLink>
              </div>
            </div>
            <aside className="hero-quick-card" aria-label="使用流程">
              {steps.map((step, index) => (
                <div key={step.title}>
                  <span>{index + 1}</span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </div>
              ))}
            </aside>
          </div>
        </section>

        <section className="section compact-section" id="features">
          <div className="container">
            <SectionHeading eyebrow="核心功能" title="只保留家長真正會用的流程" description="先把試卷預覽、列印、水印做好；其他複雜功能不打擾主流程。" />
            <div className="feature-grid compact-feature-grid">
              {features.map(({ title, description, icon: Icon, tone }) => (
                <article className="feature-card elevated-card" key={title}>
                  <span className={`feature-icon ${tone}`}><Icon /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section compact-section">
          <div className="container cta-banner commercial-cta">
            <div>
              <p className="eyebrow">開始使用</p>
              <h2>先試印一份卷。</h2>
              <p>建立帳戶後即可預覽及列印可用試卷。</p>
            </div>
            <ButtonLink href="/register">免費建立帳戶<ArrowRightIcon /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
