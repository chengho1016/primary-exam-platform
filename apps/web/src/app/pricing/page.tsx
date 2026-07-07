import { CheckIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

const plans = [
  { name: "考試之星", description: "適合每月溫習", price: "$128", suffix: "／月", features: ["水印試卷列印", "按年級科目揀卷", "最多3個孩子檔案", "單月收費，隨時取消"], cta: "聯絡開通", href: "/contact?plan=star", featured: false },
  { name: "考試之王", description: "全年最抵用", price: "$300", suffix: "／年", features: ["考試之星全部功能", "全年無限列印", "每年收費，節省 $1,236", "優先客服支援"], cta: "聯絡開通", href: "/contact?plan=king", featured: true },
];

const faqs = [
  ["付款後如何開通？", `請用 ${siteConfig.supportEmail} 聯絡；管理員會為你開通會籍。`],
  ["試卷資源安全嗎？", "列印頁會加入會員電郵、電話、日期及授權編號水印。"],
  ["可以幾多個孩子使用？", "每個家長帳戶最多可加入 3 個孩子檔案。"],
] as const;

export const metadata = { title: "收費方案" };

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pricing-hero-section">
          <div className="container">
            <SectionHeading eyebrow="收費方案" title="兩個方案，簡單選擇" description="按需要選擇月費或年費，即可使用試卷預覽及水印列印。" />
            <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>{plan.featured ? <span className="pricing-ribbon">最抵</span> : null}<h3>{plan.name}</h3><p>{plan.description}</p><div className="price">{plan.price}<small>{plan.suffix}</small></div><ul className="feature-list">{plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><ButtonLink className="button-full" href={plan.href} variant={plan.featured ? "primary" : "secondary"}>{plan.cta}</ButtonLink></article>)}</div>
          </div>
        </section>
        <section className="section section-muted">
          <div className="container faq-grid">
            <SectionHeading eyebrow="FAQ" title="常見問題" />
            <div className="faq-list">{faqs.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
