import { AppShell } from "@/components/app-shell";
import { CheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

const plans = [
  { name: "免費試用", description: "適合先體驗練習流程的家庭", price: "$0", suffix: "永久", features: ["每月3次15題練習", "儲存最近錯題", "預覽精選試卷"], button: "目前計劃", featured: false },
  { name: "家庭月費", description: "持續溫習及列印試卷", price: "$88", suffix: "／月", features: ["不限次數網上練習", "每月10份列印額度", "完整錯題本及家長報告", "最多3個孩子檔案"], button: "選擇月費計劃", featured: true },
  { name: "逐份購買", description: "只需要個別試卷的家庭", price: "$18", suffix: "／份起", features: ["指定試卷永久練習權", "2次水印列印授權", "保留該卷錯題紀錄"], button: "瀏覽可購買試卷", featured: false },
];

export const metadata = { title: "會員計劃" };

export default function MembershipPage() {
  return (
    <AppShell activePath="/membership">
      <div className="app-content">
        <header className="app-page-header"><div><h1>選擇合適的會員計劃</h1><p>先免費試用，需要更多內容時才升級；付款功能將於正式上線時啟用。</p></div></header>
        <div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>{plan.featured ? <span className="pricing-ribbon">最受歡迎</span> : null}<h3>{plan.name}</h3><p>{plan.description}</p><div className="price">{plan.price}<small>{plan.suffix}</small></div><ul className="feature-list">{plan.features.map((feature) => <li key={feature}><CheckIcon />{feature}</li>)}</ul><ButtonLink className="button-full" href="/papers" variant={plan.featured ? "primary" : "secondary"}>{plan.button}</ButtonLink></article>)}</div>
      </div>
    </AppShell>
  );
}
