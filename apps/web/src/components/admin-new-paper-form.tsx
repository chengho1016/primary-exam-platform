"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadIcon } from "@/components/icons";

export function AdminNewPaperForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/papers", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "上傳失敗");
        return;
      }
      router.push("/admin/papers?created=1");
      router.refresh();
    } catch {
      setError("網絡錯誤，請稍後再試");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form" encType="multipart/form-data">
      <section className="form-panel">
        <h2>試卷檔案</h2>
        <p>支援PDF、Word及清晰掃描圖片；檔案會儲存在私人目錄，上傳後不會自動發布。</p>
        <label className="dropzone" htmlFor="paper-file">
          <span><UploadIcon /><strong>拖放檔案或按此選擇</strong><span>PDF、DOCX、PNG、JPG · 每份最多50MB</span></span>
          <input accept=".pdf,.docx,.png,.jpg,.jpeg" id="paper-file" name="paperFile" required style={{ display: "none" }} type="file" />
        </label>
      </section>
      <aside className="form-panel">
        <h2>基本資料</h2>
        <p>這些資料會成為會員的搜尋及篩選條件。</p>
        <div className="form-stack">
          <div className="field"><label htmlFor="paper-code">試卷編號</label><input id="paper-code" name="code" placeholder="例如：2526-01-MA-P4" required /></div>
          <div className="field"><label htmlFor="paper-title">試卷名稱</label><input id="paper-title" name="title" placeholder="例如：四年級數學科考試一" required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="paper-grade">年級</label><select id="paper-grade" name="grade" defaultValue="4">{[1,2,3,4,5,6].map((grade) => <option value={grade} key={grade}>小{grade}</option>)}</select></div>
            <div className="field"><label htmlFor="paper-subject">科目</label><select id="paper-subject" name="subject" defaultValue="數學"><option>中文</option><option>英文</option><option>數學</option><option>人文</option><option>科學</option></select></div>
          </div>
          <div className="field"><label htmlFor="paper-year">學年</label><input id="paper-year" name="academicYear" placeholder="2025–2026" /></div>
          <div className="field"><label htmlFor="paper-access">會員存取</label><select id="paper-access" name="access" defaultValue="MEMBERSHIP"><option value="FREE">免費試用</option><option value="MEMBERSHIP">月費會員</option><option value="PURCHASE">逐份購買</option></select></div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button-primary button-full" disabled={isPending} type="submit">{isPending ? "正在安全上傳…" : "儲存草稿並上傳"}</button>
        </div>
      </aside>
    </form>
  );
}
