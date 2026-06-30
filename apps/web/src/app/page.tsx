import { ArrowRightIcon, ChartIcon, CheckIcon, PaperIcon, PrinterIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";

const features = [
  { title: "智能15題練習", description: "按課題及難度平衡抽題，避免每次都抽到相同類型。", icon: SparklesIcon, tone: "blue" },
  { title: "即時批改與解析", description: "完成後即時知道對錯、得分及正確答案，學習不留到明天。", icon: CheckIcon, tone: "mint" },
  { title: "個人錯題本", description: "做錯的題目自動儲存，方便孩子針對弱項重新挑戰。", icon: PaperIcon, tone: "sun" },
  { title: "安全水印列印", description: "每次列印加入會員、日期及授權編號，減少未授權流傳。", icon: ShieldIcon, tone: "coral" },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">小一至小六 · 中英數人文科學</p>
              <h1>讓孩子把每份試卷，變成<span>看得見的進步</span></h1>
              <p>選年級、選科目，隨時做15題智能練習或列印完整試卷。家長可掌握紀錄，孩子也知道下一步要改善甚麼。</p>
              <div className="hero-actions">
                <ButtonLink href="/register">免費開始練習<ArrowRightIcon /></ButtonLink>
                <ButtonLink href="/papers" variant="secondary">瀏覽試卷庫</ButtonLink>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack"><span>樂</span><span>晴</span><span>朗</span></div>
                <span>免費帳戶可先試做精選練習</span>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="visual-orbit" />
              <div className="practice-mock">
                <div className="mock-top"><div className="mock-dots"><i /><i /><i /></div><span className="mock-pill">第 6 / 15 題</span></div>
                <div className="mock-progress"><span /></div>
                <div className="mock-question">
                  <small>四年級 · 數學 · 分數</small>
                  <strong>3/4 等於下列哪一個分數？</strong>
                  <div className="mock-options"><span>6/10</span><span className="selected">9/12</span><span>12/20</span><span>15/24</span></div>
                </div>
              </div>
              <div className="floating-card floating-score"><ChartIcon />本週正確率 86%</div>
              <div className="floating-card floating-print"><PrinterIcon />試卷已加個人水印</div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <SectionHeading eyebrow="一個平台，兩種學習方式" title="網上練習與紙本試卷，毋須二選一" description="孩子可以在線上快速練習，亦可以按需要列印完整試卷，在家模擬正式測考。" />
            <div className="feature-grid">
              {features.map(({ title, description, icon: Icon, tone }) => (
                <article className="feature-card" key={title}>
                  <span className={`feature-icon ${tone}`}><Icon /></span>
                  <h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-muted" id="how-it-works">
          <div className="container">
            <SectionHeading eyebrow="三步開始" title="簡單得孩子自己也懂" description="介面按照孩子真正使用的次序設計，家長毋須每次在旁協助。" />
            <div className="steps-grid">
              <article className="step-card"><span className="step-number">1</span><h3>選擇年級與科目</h3><p>從小一至小六，快速找到中文、英文、數學、人文或科學試卷。</p></article>
              <article className="step-card"><span className="step-number">2</span><h3>練習或列印</h3><p>抽取15題即時作答，或預覽後直接列印帶有個人水印的完整試卷。</p></article>
              <article className="step-card"><span className="step-number">3</span><h3>看結果再進步</h3><p>即時批改並儲存錯題；家長可從報告掌握孩子的課題弱項。</p></article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-banner">
            <div><h2>先試一份，看看孩子是否喜歡。</h2><p>免費建立家長帳戶，毋須立即選擇收費計劃。</p></div>
            <ButtonLink href="/register">建立免費帳戶<ArrowRightIcon /></ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
