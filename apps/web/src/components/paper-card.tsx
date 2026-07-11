import Link from "next/link";
import { LockIcon, PaperIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { isOnlinePracticeEnabled } from "@/lib/features";
import type { PaperSummary } from "@/lib/domain/types";

const difficultyLabel = { easy: "基礎", medium: "標準", hard: "進階" } as const;

export function PaperCard({ paper }: { paper: PaperSummary }) {
  const canPractice = isOnlinePracticeEnabled && paper.questionCount >= 15;

  return (
    <article className="paper-card upgraded-paper-card clean-paper-card">
      <div className={`paper-illustration subject-${paper.subjectId}`}>
        <div className="paper-cover-lines" aria-hidden="true"><span /><span /><span /></div>
        <PaperIcon />
        <span>{paper.subject}</span>
        <small>{paper.academicYear}</small>
      </div>
      <div className="paper-content">
        <div className="paper-badges">
          <Badge tone="blue">小{paper.grade}</Badge>
          <Badge tone={paper.difficulty === "hard" ? "coral" : "mint"}>{difficultyLabel[paper.difficulty]}</Badge>
          {paper.access !== "free" ? <Badge tone="sun"><LockIcon />會員</Badge> : <Badge tone="gray">免費</Badge>}
        </div>
        <h3>{paper.title}</h3>
        <div className="paper-card-meta">
          <span>{paper.academicYear}</span>
          <span>{paper.questionCount > 0 ? `${paper.questionCount}題` : "紙本試卷"}</span>
          <span>{paper.pageCount > 0 ? `${paper.pageCount}頁` : "頁數待確認"}</span>
          <span>{paper.durationMinutes}分鐘</span>
        </div>
        <div className="paper-card-actions clean-card-actions">
          <Link className="button button-primary button-small" href={`/papers/${paper.id}`}>預覽 / 列印</Link>
          {canPractice ? <Link className="button button-secondary button-small" href={`/practice/${paper.id}`}><SparklesIcon />練習</Link> : null}
        </div>
      </div>
    </article>
  );
}
