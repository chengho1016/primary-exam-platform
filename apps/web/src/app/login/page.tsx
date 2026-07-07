import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { LoginForm } from "@/components/auth-forms";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: "會員登入" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="brand" href="/"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
        <div className="auth-aside-copy"><h1>登入後即可預覽及列印試卷。</h1><p>按孩子年級揀卷，確認內容後輸出水印紙本。</p></div>
        <div className="auth-quote">「清楚的試卷流程，家長和孩子都更容易跟得上。」</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <h2>歡迎回來</h2><p>請登入你的帳戶。</p>
          <LoginForm />
          <p className="auth-switch">還沒有帳戶？ <Link href="/register">免費註冊</Link></p>
        </div>
      </section>
    </main>
  );
}
