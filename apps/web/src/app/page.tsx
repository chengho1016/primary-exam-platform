import { ArrowRightIcon, ChartIcon, CheckIcon, PaperIcon, PrinterIcon, ShieldIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";

const features = [
  { title: "完整試卷預覽", description: "先睇清楚年級、科目、題量同頁數，再決定是否列印，避免家長印錯卷。", icon: PaperIcon, tone: "blue" },
  { title: "安全水印列印", description: "每次列印加入會員電郵、電話、日期及授權編號，方便管理正式試卷資源。", icon: ShieldIcon, tone: "coral" },
  { title: "按年級開放試卷", description: "系統只顯示孩子已登記年級可使用的試卷，家長揀卷更清晰。", icon: CheckIcon, tone: "mint" },
  { title: "線上練習稍後獨立開放", description: "影印試卷同線上練習先拆開；目前先把紙本預覽、列印、水印及權限流程做好。", icon: SparklesIcon, tone: "sun" },
] as const;

const heroStats = [
  { value: "P1-P6", label: "按年級揀卷" },
  { value: "水印", label: "正式試卷列印" },
  { value: "獨立", label: "練習服務稍後重開" },
] as const;

const trustItems = [
  { title: "孩子做紙本卷", description: "先用完整試卷模擬考試節奏，減少被線上功能分心。", icon: UsersIcon },
  { title: "家長易跟進", description: "預覽、列印、會員權限集中處理，流程清楚直接。", icon: ChartIcon },
  { title: "管理員管得到", description: "後台支援試卷、會員、列印、資料庫概覽同安全操作。", icon: ShieldIcon },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero commercial-hero">
          <div className="container hero-grid redesign-hero-grid">
            <div className="hero-copy redesign-hero-copy">
              <p className="eyebrow">香港小學生 · 試卷預覽 / 水印列印 / 家長跟進</p>
              <h1>先把試卷印好，家長即刻可以用。</h1>
              <p>考試吧現階段先專注影印試卷：家長可以按年級和科目揀卷、預覽內容，再用會員水印列印完整紙本。線上練習會之後拆成獨立服務再開放。</p>
              <div className="hero-actions">
                <ButtonLink href="/papers">瀏覽影印試卷庫<ArrowRightIcon /></ButtonLink>
                <ButtonLink href="/register" variant="secondary">建立免費帳戶</ButtonLink>
              </div>
              <div className="hero-proof redesigned-proof">
                <div className="avatar-stack"><span>卷</span><span>印</span><span>溫</span></div>
                <span>先預覽完整卷，再列印紙本，最後由家長按正式測驗節奏跟進。</span>
              </div>
              <div className="hero-stats" aria-label="平台重點數據">
                {heroStats.map((stat) => (
                  <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>
                ))}
              </div>
            </div>
            <div className="hero-visual redesign-visual" aria-hidden="true">
              <div className="learning-console">
                <div className="console-topline">
                  <span>Print OS</span>
                  <strong>影印試卷</strong>
                </div>
                <div className="console-main-score">
                  <span>A4</span>
                  <div><strong>水印列印</strong><small>小四數學 · 完整試卷</small></div>
                </div>
                <div className="console-question-card">
                  <small>試卷預覽</small>
                  <strong>確認題量、頁數、課題後再列印</strong>
                  <div className="console-options"><span>小四</span><span className="selected">數學</span><span>PDF</span></div>
                </div>
                <div className="console-metrics">
                  <div><span>權限</span><strong>年級</strong></div>
                  <div><span>水印</span><strong>會員</strong></div>
                  <div><span>輸出</span><strong>A4</strong></div>
                </div>
              </div>
              <div className="floating-card floating-score"><PrinterIcon />可預覽列印</div>
              <div className="floating-card floating-print"><ShieldIcon />試卷已加水印</div>
              <div className="learning-orbit orbit-one" />
              <div className="learning-orbit orbit-two" />
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <SectionHeading eyebrow="先專注一件事" title="影印試卷同線上練習，正式拆開處理" description="目前先把紙本預覽、列印、水印、會員權限流程做到穩定。線上練習保留為獨立服務，準備好後再重新開放。" />
            <div className="feature-grid">
              {features.map(({ title, description, icon: Icon, tone }) => (
                <article className="feature-card elevated-card" key={title}>
                  <span className={`feature-icon ${tone}`}><Icon /></span>
                  <h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-muted" id="how-it-works">
          <div className="container">
            <SectionHeading eyebrow="三步開始" title="揀卷、預覽、列印" description="家長不需要先理解線上練習流程；先把完整紙本試卷印出來，就可以立即用。" />
            <div className="steps-grid">
              <article className="step-card"><span className="step-number">1</span><h3>選擇年級與科目</h3><p>從小一至小六，快速找到中文、英文、數學、人文或科學試卷。</p></article>
              <article className="step-card"><span className="step-number">2</span><h3>預覽及水印列印</h3><p>確認內容合適後，列印帶有會員水印的完整試卷。</p></article>
              <article className="step-card"><span className="step-number">3</span><h3>紙本作答再跟進</h3><p>孩子按正式測驗節奏完成，家長再按需要批改及溫習。</p></article>
            </div>
          </div>
        </section>

        <section className="section commercial-section">
          <div className="container">
            <SectionHeading eyebrow="為正式營運而設" title="不是 demo 頁，而是一個可以持續管理的系統" description="第一階段先確保家長、學生、管理員三邊的影印試卷流程清楚，之後再逐步重開線上練習。" />
            <div className="trust-grid">
              {trustItems.map(({ title, description, icon: Icon }) => (
                <article className="trust-card" key={title}>
                  <span><Icon /></span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-banner commercial-cta">
            <div><p className="eyebrow">Ready for print</p><h2>先試一份，看看紙本流程是否順手。</h2><p>免費建立家長帳戶，先使用試卷庫預覽及水印列印。線上練習服務之後再獨立開放。</p></div>
            <ButtonLink href="/register">建立免費帳戶<ArrowRightIcon /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
