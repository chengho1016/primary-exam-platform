import { AppShell } from "@/components/app-shell";
import { CheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

const plans = [
  { name: "考試之星", description: "無限下載及列印，適合恆常溫習", price: "$128", suffix: "／月", features: ["不限次數網上練習", "無限水印列印", "完整錯題本及家長報告", "最多3個孩子檔案", "單月收費，隨時取消"], button: "聯絡開通", href: "/contact?plan=star", featured: false },
  { name: "考試之王", description: "全年無限下載及列印，最抵用", price: "$300", suffix: "／年", features: ["考試之星全部功能", "全年無限下載及列印", "每年收費，節省 $1,236", "優先客服支援"], button: "聯絡開通", href: "/contact?plan=king", featured: true },
];

export const metadata = { title: "會員計劃" };

export default function MembershipPage() {
  return (
    <AppShell activePath="/membership">
      <div className="app-content">
        <header className="app-page-header"><div><h1>選擇合適的會員計劃</h1><p>早期商業化先以人工開通為主：聯絡客服後，管理員可即時在後台設定會籍、方案及列印額度。</p></div><ButtonLink href="/pricing" variant="secondary">查看公開收費頁</ButtonLink></header>
        <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>{plan.featured ? <span className="pricing-ribbon">最受歡迎</span> : null}<h3>{plan.name}</h3><p>{plan.description}</p><div className="price">{plan.price}<small>{plan.suffix}</small></div><ul className="feature-list">{plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><ButtonLink className="button-full" href={plan.href} variant={plan.featured ? "primary" : "secondary"}>{plan.button}</ButtonLink></article>)}</div>
      </div>
    </AppShell>
  );
}
