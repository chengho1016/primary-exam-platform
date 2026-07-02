"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BackfillResult = {
  success?: boolean;
  error?: string;
  stats?: {
    questionsScanned: number;
    versionsCreated: number;
    versionsAlreadyPresent: number;
  };
};

export function QuestionVersionBackfillButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBackfill() {
    setIsRunning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/questions/backfill-versions", { method: "POST" });
      const payload = (await response.json()) as BackfillResult;
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "Question version backfill failed");

      const stats = payload.stats;
      setMessage(stats ? `完成：掃描 ${stats.questionsScanned} 題，新增 ${stats.versionsCreated} 個版本，已存在 ${stats.versionsAlreadyPresent} 個。` : "版本 backfill 完成。");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Question version backfill failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="form-actions">
      <button className="button button-secondary" disabled={isRunning} onClick={runBackfill} type="button">
        {isRunning ? "題目版本 backfill 執行中…" : "重建缺失題目版本 snapshot"}
      </button>
      <span className={error ? "form-error" : "form-helper"}>
        {error ?? message ?? "只限 Admin：為現有題目補 QuestionVersion v1；不會改動學生作答紀錄。"}
      </span>
    </div>
  );
}
