import Link from "next/link";
import { LockIcon, PaperIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import type { PaperSummary } from "@/lib/domain/types";

const difficultyLabel = { easy: "基礎", medium: "標準", hard: "進階" } as const;

export function PaperCard({ paper }: { paper: PaperSummary }) {
  const canPractice = paper.questionCount >= 15;

  return (
    <article className="paper-card upgraded-paper-card">
      <div className={`paper-illustration subject-${paper.subjectId}`}>
        <PaperIcon />
        <span>{paper.subject}</span>
      </div>
      <div className="paper-content">
        <div className="paper-badges">
          <Badge tone="blue">小{paper.grade}</Badge>
          <Badge tone={paper.difficulty === "hard" ? "coral" : "mint"}>{difficultyLabel[paper.difficulty]}</Badge>
          {paper.access !== "free" ? <Badge tone="sun"><LockIcon />會員</Badge> : <Badge tone="gray">免費試用</Badge>}
        </div>
        <h3>{paper.title}</h3>
        <div className="paper-card-meta">
          <span>{paper.academicYear}</span>
          <span>{paper.questionCount}題</span>
          <span>約{paper.durationMinutes}分鐘</span>
        </div>
        <div className="paper-readiness">
          <span className={canPractice ? "ready" : "pending"}>{canPractice ? "可即時練習" : "待補題庫"}</span>
          <small>{canPractice ? "適合網上15題練習" : "可先查看或列印試卷"}</small>
        </div>
        <div className="paper-card-actions">
          <Link className="button button-secondary button-small" href={`/papers/${paper.id}`}>查看詳情</Link>
          {canPractice ? <Link className="button button-primary button-small" href={`/practice/${paper.id}`}><SparklesIcon />開始練習</Link> : <Link className="card-link" href={`/papers/${paper.id}`}>查看試卷 →</Link>}
        </div>
      </div>
    </article>
  );
}
