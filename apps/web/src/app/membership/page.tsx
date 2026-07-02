import { AppShell } from "@/components/app-shell";
import { CheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

const plans = [
  { name: "免費試用", description: "適合先體驗練習流程的家庭", price: "$0", suffix: "永久", features: ["瀏覽公開試卷", "試做精選15題練習", "建立孩子檔案"], button: "瀏覽試卷", href: "/papers", featured: false },
  { name: "家庭月費", description: "正式溫習及列印試卷", price: "$88", suffix: "／月", features: ["不限次數網上練習", "每月10份列印額度", "完整錯題本及家長報告", "最多3個孩子檔案"], button: "聯絡開通", href: "/contact?plan=monthly", featured: true },
  { name: "逐份購買", description: "只需要個別試卷的家庭", price: "$18", suffix: "／份起", features: ["指定試卷永久練習權", "2次水印列印授權", "保留該卷錯題紀錄"], button: "瀏覽可購買試卷", href: "/papers", featured: false },
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
