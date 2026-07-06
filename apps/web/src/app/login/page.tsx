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
        <div className="auth-aside-copy"><h1>先揀卷，再列印，從紙本開始。</h1><p>現階段先專注影印試卷：登入後按孩子年級揀卷、預覽後即時水印列印。線上練習會之後獨立開放。</p></div>
        <div className="auth-quote">「最有用的不是做更多題，而是知道哪一類題目需要再試一次。」</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <h2>歡迎回來</h2><p>請登入你的家長或管理員帳戶。</p>
          <LoginForm />
          <p className="auth-switch">還沒有帳戶？ <Link href="/register">免費註冊</Link></p>
          <div className="demo-note">本機測試帳戶可由系統管理員提供；密碼不會以明文儲存。</div>
        </div>
      </section>
    </main>
  );
}
