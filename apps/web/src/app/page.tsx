import { ArrowRightIcon, PaperIcon, PrinterIcon, ShieldIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";

const features = [
  { title: "揀得快", description: "按孩子年級和科目篩選，唔需要逐頁搵卷。", icon: PaperIcon, tone: "blue" },
  { title: "印得準", description: "列印前先睇清楚題量、頁數和建議時間，避免印錯。", icon: PrinterIcon, tone: "mint" },
  { title: "保護資源", description: "每次列印加入會員水印，適合家庭自用。", icon: ShieldIcon, tone: "coral" },
] as const;

const steps = [
  { title: "選年級科目", description: "小一至小六，中文、英文、數學、人文、科學。" },
  { title: "先預覽資料", description: "確認題目數、頁數、用時和涵蓋課題。" },
  { title: "列印水印版", description: "產生可列印版本，方便孩子做紙本練習。" },
] as const;

const stats = [
  ["P1-P6", "小學年級"],
  ["5科", "主科分類"],
  ["水印", "列印保護"],
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero commercial-hero clean-home-hero home-hero-upgraded">
          <div className="container hero-grid clean-hero-grid home-hero-grid">
            <div className="hero-copy redesign-hero-copy home-hero-copy">
              <p className="eyebrow">香港小學生試卷平台</p>
              <h1>用一個清楚流程，搞掂溫習試卷。</h1>
              <p>考試吧幫家長按孩子年級快速揀卷，先預覽，再列印水印紙本。少啲亂、少啲搵，更多時間留返畀孩子做題。</p>
              <div className="hero-actions">
                <ButtonLink href="/papers">瀏覽試卷庫<ArrowRightIcon /></ButtonLink>
                <ButtonLink href="/register" variant="secondary">免費建立帳戶</ButtonLink>
              </div>
              <div className="hero-metric-row" aria-label="平台重點">
                {stats.map(([value, label]) => (
                  <span key={label}><strong>{value}</strong><small>{label}</small></span>
                ))}
              </div>
            </div>

            <aside className="home-preview-card" aria-label="試卷流程預覽">
              <div className="preview-card-top">
                <span>今日溫習</span>
                <strong>小四數學</strong>
              </div>
              <div className="preview-paper-sheet" aria-hidden="true">
                <div className="sheet-line wide" />
                <div className="sheet-line" />
                <div className="sheet-line short" />
                <div className="sheet-question">1</div>
                <div className="sheet-question muted">2</div>
                <div className="sheet-watermark">Exam Go · 水印列印</div>
              </div>
              <div className="preview-checklist">
                {steps.map((step, index) => (
                  <div key={step.title}>
                    <span>{index + 1}</span>
                    <div><strong>{step.title}</strong><small>{step.description}</small></div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="section compact-section" id="features">
          <div className="container">
            <SectionHeading eyebrow="核心功能" title="家長真正需要的三件事" description="將揀卷、預覽、列印變成單一清楚流程；其他複雜功能唔阻住主任務。" />
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
          <div className="container cta-banner commercial-cta home-final-cta">
            <div>
              <p className="eyebrow">開始使用</p>
              <h2>先搵一份啱年級的試卷。</h2>
              <p>建立帳戶後即可預覽可用試卷，確認後再列印。</p>
            </div>
            <ButtonLink href="/register">免費建立帳戶<ArrowRightIcon /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
