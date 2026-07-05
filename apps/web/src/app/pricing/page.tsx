import { CheckIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

const plans = [
  { name: "考試之星", description: "無限下載及列印，適合恆常溫習", price: "$128", suffix: "／月", features: ["不限次數網上練習", "無限水印列印", "完整錯題本及家長報告", "最多3個孩子檔案", "單月收費，隨時取消"], cta: "聯絡開通", href: "/contact?plan=star", featured: false },
  { name: "考試之王", description: "全年無限下載及列印，最抵用", price: "$300", suffix: "／年", features: ["考試之星全部功能", "全年無限下載及列印", "每年收費，節省 $1,236", "優先客服支援"], cta: "聯絡開通", href: "/contact?plan=king", featured: true },
];

const faqs = [
  ["而家可以收錢用未？", "可以用手動商業化流程：家長由此頁選方案並聯絡開通，管理員在後台會員管理設定 ACTIVE 會籍、方案及列印額度。之後再接 Stripe/PayMe/FPS 自動付款。"],
  ["孩子做題要不要家長陪？", "每日練習入口、試卷庫、錯題本已分開，孩子可以直接做題；家長主要看報告及列印。"],
  ["試卷資源安全嗎？", "列印頁會加入會員電郵、電話號碼、日期及授權編號水印；後台操作會寫入 AdminAuditLog。"],
  ["付款後如何開通？", `正式自動付款前，請用 ${siteConfig.supportEmail} 聯絡；管理員可即時在後台開通會籍與列印額度。`],
] as const;

export const metadata = { title: "收費方案｜小學堂" };

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pricing-hero-section">
          <div className="container">
            <SectionHeading eyebrow="Plans" title="兩個方案，無限練習與列印" description="考試之星適合逐月使用，考試之王全年最抵。聯絡客服後，管理員可即時開通會籍。" />
            <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>{plan.featured ? <span className="pricing-ribbon">建議主推</span> : null}<h3>{plan.name}</h3><p>{plan.description}</p><div className="price">{plan.price}<small>{plan.suffix}</small></div><ul className="feature-list">{plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><ButtonLink className="button-full" href={plan.href} variant={plan.featured ? "primary" : "secondary"}>{plan.cta}</ButtonLink></article>)}</div>
          </div>
        </section>
        <section className="section section-muted">
          <div className="container commercial-readiness-grid">
            <article className="trust-card"><span><SparklesIcon /></span><div><h3>今日可落地</h3><p>不等 payment gateway：家長先聯絡、管理員即時開通會籍，流程已經能支援早期商業化。</p></div></article>
            <article className="trust-card"><span><ShieldIcon /></span><div><h3>權限清晰</h3><p>FREE / MEMBERSHIP / PURCHASE 已在資料庫及前台權限判斷中使用，可逐步擴展。</p></div></article>
            <article className="trust-card"><span><CheckIcon /></span><div><h3>可驗證營運</h3><p>會員、訂閱、列印、後台操作都可在 Admin Database 概覽查看。</p></div></article>
          </div>
        </section>
        <section className="section">
          <div className="container faq-grid">
            <SectionHeading eyebrow="FAQ" title="家長購買前最常問的問題" />
            <div className="faq-list">{faqs.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
