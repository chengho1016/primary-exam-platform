import Link from "next/link";
import { logoutAction } from "@/app/auth-actions";
import { BookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark"><BookIcon /></span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="public-nav" aria-label="主要導覽">
          <Link href="/#how-it-works">使用方法</Link>
          <Link href="/papers">試卷庫</Link>
          <Link href="/pricing">收費方案</Link>
          <Link href="/contact">聯絡我們</Link>
        </nav>
        <div className="header-actions">
          {user ? <><Link className="header-login" href={user.role === "ADMIN" ? "/admin" : "/dashboard"}>{user.displayName}</Link><form action={logoutAction}><button className="button button-secondary button-small" type="submit">登出</button></form></> : <><Link className="header-login" href="/login">登入</Link><Link className="button button-primary button-small" href="/register">免費試用</Link></>}
        </div>
      </div>
    </header>
  );
}
