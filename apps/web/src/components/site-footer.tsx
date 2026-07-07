import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid compact-footer-grid">
        <div>
          <Link className="brand footer-brand" href="/"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <p>香港小學生試卷預覽與水印列印平台。</p>
        </div>
        <div><strong>使用</strong><Link href="/papers">試卷庫</Link><Link href="/pricing">收費</Link><Link href="/membership">會員中心</Link></div>
        <div><strong>支援</strong><Link href="/contact">聯絡我們</Link><Link href="/privacy">私隱政策</Link><Link href="/terms">服務條款</Link></div>
      </div>
      <div className="container footer-bottom">© 2026 {siteConfig.name}</div>
    </footer>
  );
}
