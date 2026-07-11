import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { RegisterForm } from "@/components/auth-forms";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "免費註冊" };

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="brand" href="/"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
        <div className="auth-aside-copy"><h1>一個家長帳戶，照顧每個孩子。</h1><p>建立孩子檔案後，系統會按年級整理可用試卷，預覽清楚後再列印水印版本。</p></div>
        <div className="auth-quote">免費建立帳戶後可先瀏覽試卷；需要更多列印額度時，再開通月費或年費方案。</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <h2>建立免費帳戶</h2><p>先填寫家長資料，同時加入最多 3 位小朋友。</p>
          <RegisterForm />
          <p className="auth-switch">已有帳戶？ <Link href="/login">立即登入</Link></p>
        </div>
      </section>
    </main>
  );
}
