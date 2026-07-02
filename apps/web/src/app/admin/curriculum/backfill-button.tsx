"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BackfillResult = {
  success?: boolean;
  error?: string;
  stats?: {
    papersLinked: number;
    questionsLinked: number;
    topicsCreatedOrUpdated: number;
    knowledgePointsCreatedOrUpdated: number;
    unmappedPapers: Array<{ id: string; code: string; subject: string }>;
  };
};

export function CurriculumBackfillButton({ needsBackfill }: { needsBackfill: boolean }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBackfill() {
    setIsRunning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/curriculum/backfill", { method: "POST" });
      const payload = (await response.json()) as BackfillResult;
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "Backfill failed");

      const stats = payload.stats;
      setMessage(stats ? `完成：連結 ${stats.papersLinked} 份試卷、${stats.questionsLinked} 題；更新 ${stats.topicsCreatedOrUpdated} 個 topic 操作。` : "Backfill 完成。");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Backfill failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="form-actions">
      <button className="button button-primary" disabled={isRunning} onClick={runBackfill} type="button">
        {isRunning ? "Backfill 執行中…" : needsBackfill ? "執行 taxonomy backfill" : "重新執行 backfill 檢查"}
      </button>
      <span className={error ? "form-error" : "form-helper"}>{error ?? message ?? "只限 Admin：建立預設科目、課程、Topic、KnowledgePoint，並連結 legacy 試卷/題目。"}</span>
    </div>
  );
}
