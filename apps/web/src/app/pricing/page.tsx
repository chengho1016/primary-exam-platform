import { CheckIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

const plans = [
  { name: "免費試用", description: "適合先試流程的家庭", price: "$0", suffix: "永久", features: ["可瀏覽公開試卷", "試做精選15題練習", "建立家長與孩子帳戶"], cta: "免費註冊", href: "/register", featured: false },
  { name: "家庭月費", description: "正式溫習、列印及追蹤弱項", price: "$88", suffix: "／月", features: ["不限次數網上練習", "每月10份水印列印額度", "完整錯題本與家長報告", "最多3個孩子檔案"], cta: "聯絡開通", href: "/contact?plan=monthly", featured: true },
  { name: "逐份試卷", description: "只需要指定考試卷時使用", price: "$18", suffix: "／份起", features: ["指定試卷永久練習權", "2次水印列印授權", "保留該卷錯題紀錄"], cta: "瀏覽試卷", href: "/papers", featured: false },
];

const faqs = [
  ["而家可以收錢用未？", "可以用手動商業化流程：家長由此頁選方案並聯絡開通，管理員在後台會員管理設定 ACTIVE 會籍、方案及列印額度。之後再接 Stripe/PayMe/FPS 自動付款。"],
  ["孩子做題要不要家長陪？", "每日練習入口、試卷庫、錯題本已分開，孩子可以直接做題；家長主要看報告及列印。"],
  ["試卷資源安全嗎？", "列印頁會加入會員、日期及授權編號水印；後台操作會寫入 AdminAuditLog。"],
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
            <SectionHeading eyebrow="Commercial MVP" title="可以先收費營運，再逐步接入自動付款" description="第一階段用清楚方案 + 後台手動開通，先驗證家長願意付費；付款 provider 準備好後再自動化。" />
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
