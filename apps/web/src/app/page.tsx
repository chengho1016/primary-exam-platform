import { ArrowRightIcon, ChartIcon, CheckIcon, PaperIcon, PrinterIcon, ShieldIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";

const features = [
  { title: "智能15題練習", description: "用短時間完成一組有節奏的題目，適合每日溫習，不會令孩子覺得負擔太大。", icon: SparklesIcon, tone: "blue" },
  { title: "即時批改與解析", description: "完成後即時知道對錯、得分及正確答案，家長不用逐題人手改。", icon: CheckIcon, tone: "mint" },
  { title: "錯題與弱項追蹤", description: "做錯的題目自動儲存，逐步看見孩子在哪些課題需要再練。", icon: PaperIcon, tone: "sun" },
  { title: "安全水印列印", description: "每次列印加入會員電郵、電話、日期及授權編號，方便管理正式試卷資源。", icon: ShieldIcon, tone: "coral" },
] as const;

const heroStats = [
  { value: "15題", label: "每日短練習" },
  { value: "47題", label: "已入庫題目" },
  { value: "水印", label: "正式試卷列印" },
] as const;

const trustItems = [
  { title: "孩子看得懂", description: "按年級、科目、試卷清楚分層，入口唔會混亂。", icon: UsersIcon },
  { title: "家長看得到", description: "練習紀錄、錯題本、列印權限集中管理，方便跟進。", icon: ChartIcon },
  { title: "管理員管得到", description: "後台支援試卷、題目、會員、資料庫概覽同安全刪除。", icon: ShieldIcon },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero commercial-hero">
          <div className="container hero-grid redesign-hero-grid">
            <div className="hero-copy redesign-hero-copy">
              <p className="eyebrow">香港小學生 · 練習 / 列印 / 跟進</p>
              <h1>每日十五題，慢慢變成真正識做。</h1>
              <p>考試吧將試卷庫、智能練習、錯題追蹤和家長管理整理成一條清晰路線。孩子不再迷路，家長不再靠估，管理員亦可以穩定擴充題庫。</p>
              <div className="hero-actions">
                <ButtonLink href="/register">免費開始練習<ArrowRightIcon /></ButtonLink>
                <ButtonLink href="/papers" variant="secondary">瀏覽試卷庫</ButtonLink>
              </div>
              <div className="hero-proof redesigned-proof">
                <div className="avatar-stack"><span>學</span><span>練</span><span>進</span></div>
                <span>先做短練習，再列印完整卷，最後用錯題追弱項。</span>
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
                  <span>Learning OS</span>
                  <strong>今日任務</strong>
                </div>
                <div className="console-main-score">
                  <span>15</span>
                  <div><strong>題短練習</strong><small>小四數學 · 分數</small></div>
                </div>
                <div className="console-question-card">
                  <small>第 6 題</small>
                  <strong>3/4 等於下列哪一個分數？</strong>
                  <div className="console-options"><span>6/10</span><span className="selected">9/12</span><span>12/20</span></div>
                </div>
                <div className="console-metrics">
                  <div><span>正確率</span><strong>86%</strong></div>
                  <div><span>錯題</span><strong>4</strong></div>
                  <div><span>列印</span><strong>A4</strong></div>
                </div>
              </div>
              <div className="floating-card floating-score"><ChartIcon />弱項已更新</div>
              <div className="floating-card floating-print"><PrinterIcon />試卷已加水印</div>
              <div className="learning-orbit orbit-one" />
              <div className="learning-orbit orbit-two" />
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <SectionHeading eyebrow="一個平台，兩種學習方式" title="線上練習、紙本試卷、家長跟進，放回同一條路線" description="不是把功能堆在一起，而是把每日使用流程重新整理：先短練習建立信心，再用完整試卷模擬考試，最後用錯題追弱項。" />
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
            <SectionHeading eyebrow="三步開始" title="孩子知道下一步，家長知道點跟" description="重新設計後，入口按照真實使用次序排列：選內容、做任務、看結果。" />
            <div className="steps-grid">
              <article className="step-card"><span className="step-number">1</span><h3>選擇年級與科目</h3><p>從小一至小六，快速找到中文、英文、數學、人文或科學試卷。</p></article>
              <article className="step-card"><span className="step-number">2</span><h3>練習或列印</h3><p>抽取15題即時作答，或預覽後直接列印帶有個人水印的完整試卷。</p></article>
              <article className="step-card"><span className="step-number">3</span><h3>看結果再進步</h3><p>即時批改並儲存錯題；家長可從報告掌握孩子的課題弱項。</p></article>
            </div>
          </div>
        </section>

        <section className="section commercial-section">
          <div className="container">
            <SectionHeading eyebrow="為正式營運而設" title="不是 demo 頁，而是一個可以持續管理的系統" description="第一階段先確保家長、學生、管理員三邊流程清楚，之後再逐步加入數學課題組卷。" />
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
            <div><p className="eyebrow">Ready for daily use</p><h2>先試一份，看看孩子是否喜歡。</h2><p>免費建立家長帳戶，毋須立即選擇收費計劃。之後可以按需要加入更多數學題庫與自訂練習卷。</p></div>
            <ButtonLink href="/register">建立免費帳戶<ArrowRightIcon /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
