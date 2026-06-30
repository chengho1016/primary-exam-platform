import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <p>把優質試卷變成孩子每天都願意完成的一小步。</p>
        </div>
        <div><strong>學習</strong><Link href="/papers">試卷庫</Link><Link href="/membership">會員計劃</Link></div>
        <div><strong>帳戶</strong><Link href="/login">會員登入</Link><Link href="/parent">家長專區</Link></div>
        <div><strong>管理</strong><Link href="/admin">管理後台</Link><span>私隱政策</span></div>
      </div>
      <div className="container footer-bottom">© 2026 {siteConfig.name}。本機可用版本。</div>
    </footer>
  );
}
