import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <p>把優質試卷變成孩子每天都願意完成的一小步。正式營運階段支援會員、列印權限、後台審核與操作紀錄。</p>
        </div>
        <div><strong>學習</strong><Link href="/papers">試卷庫</Link><Link href="/pricing">收費方案</Link><Link href="/membership">會員中心</Link></div>
        <div><strong>支援</strong><Link href="/contact">聯絡我們</Link><Link href="/privacy">私隱政策</Link><Link href="/terms">服務條款</Link></div>
        <div><strong>管理</strong><Link href="/admin">管理後台</Link><Link href="/admin/users">會員管理</Link><Link href="/admin/database">資料庫概覽</Link></div>
      </div>
      <div className="container footer-bottom">© 2026 {siteConfig.name}。商業化 MVP，持續加入更多試卷與課題練習。</div>
    </footer>
  );
}
