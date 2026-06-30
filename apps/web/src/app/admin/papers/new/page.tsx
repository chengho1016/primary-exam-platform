import { AppShell } from "@/components/app-shell";
import { AdminNewPaperForm } from "@/components/admin-new-paper-form";

export const metadata = { title: "上傳試卷" };

export default function AdminNewPaperPage() {
  return (
    <AppShell activePath="/admin/papers/new" mode="admin">
      <div className="app-content">
        <header className="app-page-header"><div><h1>上傳新試卷</h1><p>先建立試卷資料，再進入題目辨識及答案覆核流程。</p></div></header>
        <AdminNewPaperForm />
      </div>
    </AppShell>
  );
}
