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
        <div className="auth-aside-copy"><h1>一個家長帳戶，照顧每個孩子。</h1><p>建立孩子檔案後，系統會按年級整理試卷、練習紀錄和錯題。</p></div>
        <div className="auth-quote">免費試用包括精選網上練習；需要更多試卷時才選擇月費或逐份購買。</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <h2>建立免費帳戶</h2><p>先填寫家長資料，登入後再加入孩子。</p>
          <RegisterForm />
          <p className="auth-switch">已有帳戶？ <Link href="/login">立即登入</Link></p>
        </div>
      </section>
    </main>
  );
}
