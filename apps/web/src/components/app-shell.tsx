import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/auth-actions";
import { BookIcon, CardIcon, ChartIcon, HomeIcon, PaperIcon, SettingsIcon, SparklesIcon, UploadIcon, UsersIcon, WrongBookIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";
import { getCurrentUser } from "@/lib/auth/session";

const memberNavigation = [
  { href: "/dashboard", label: "首頁", desktopLabel: "學習首頁", icon: HomeIcon },
  { href: "/papers", label: "試卷", desktopLabel: "試卷練習", icon: PaperIcon },
  { href: "/wrong-book", label: "錯題", desktopLabel: "錯題本", icon: WrongBookIcon },
  { href: "/parent", label: "報告", desktopLabel: "家長報告", icon: ChartIcon },
  { href: "/membership", label: "會員", desktopLabel: "會員計劃", icon: CardIcon },
];

const adminNavigation = [
  { href: "/admin", label: "概覽", desktopLabel: "管理概覽", icon: HomeIcon },
  { href: "/admin/papers", label: "試卷", desktopLabel: "試卷管理", icon: PaperIcon },
  { href: "/admin/questions", label: "題庫", desktopLabel: "題庫管理", icon: BookIcon },
  { href: "/admin/topics", label: "課題", desktopLabel: "數學課題", icon: SparklesIcon },
  { href: "/admin/papers/new", label: "上傳", desktopLabel: "上傳試卷", icon: UploadIcon },
  { href: "/admin/users", label: "會員", desktopLabel: "會員管理", icon: UsersIcon },
  { href: "/admin/database", label: "資料庫", desktopLabel: "資料庫概覽", icon: SettingsIcon },
];

export async function AppShell({ children, activePath, mode = "member" }: { children: ReactNode; activePath: string; mode?: "member" | "admin" }) {
  const user = await getCurrentUser();
  const navigation = mode === "admin" ? adminNavigation : memberNavigation;
  const accountName = user?.displayName ?? "訪客";
  const child = user?.children[0];
  const accountCaption = mode === "admin" ? "內容管理中心" : child ? `${child.displayName}的家長帳戶` : "會員帳戶";

  return (
    <div className={`app-layout ${mode === "admin" ? "admin-layout" : ""}`}>
      <aside className="app-sidebar">
        <Link className="brand sidebar-brand" href={mode === "admin" ? "/admin" : "/dashboard"}>
          <span className="brand-mark"><BookIcon /></span>
          <span>{siteConfig.name}</span>
          {mode === "admin" ? <em>ADMIN</em> : null}
        </Link>
        <nav className="sidebar-nav" aria-label={mode === "admin" ? "管理導覽" : "會員導覽"}>
          {navigation.map(({ href, desktopLabel, icon: Icon }) => (
            <Link className={activePath === href ? "active" : ""} href={href} key={`${href}-${desktopLabel}`}>
              <Icon />
              <span>{desktopLabel}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="avatar">{accountName.slice(0, 1)}</div>
          <div><strong>{accountName}</strong><span>{accountCaption}</span></div>
          {user ? <form action={logoutAction}><button aria-label="登出" title="登出" type="submit">↗</button></form> : null}
        </div>
      </aside>
      <main className="app-main">
        <div className="mobile-app-bar">
          <Link className="brand" href={mode === "admin" ? "/admin" : "/dashboard"}><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <span>{mode === "admin" ? "管理中心" : accountName}</span>
        </div>
        {children}
        <nav className="mobile-bottom-nav" aria-label={mode === "admin" ? "手機管理導覽" : "手機會員導覽"}>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link className={activePath === href ? "active" : ""} href={href} key={`mobile-${href}-${label}`}>
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
