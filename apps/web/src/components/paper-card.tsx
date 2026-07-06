import Link from "next/link";
import { LockIcon, PaperIcon, SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { isOnlinePracticeEnabled, onlinePracticeStatus } from "@/lib/features";
import type { PaperSummary } from "@/lib/domain/types";

const difficultyLabel = { easy: "基礎", medium: "標準", hard: "進階" } as const;

export function PaperCard({ paper }: { paper: PaperSummary }) {
  const canPractice = isOnlinePracticeEnabled && paper.questionCount >= 15;
  const readinessLabel = isOnlinePracticeEnabled
    ? canPractice ? "可即時練習" : "待補題庫"
    : "影印試卷優先";
  const readinessDescription = isOnlinePracticeEnabled
    ? canPractice ? "適合網上15題練習" : "可先查看或列印試卷"
    : "現階段先預覽及列印完整試卷";

  return (
    <article className="paper-card upgraded-paper-card">
      <div className={`paper-illustration subject-${paper.subjectId}`}>
        <div className="paper-cover-lines"><span /><span /><span /></div>
        <PaperIcon />
        <span>{paper.subject}</span>
        <small>小{paper.grade} · {paper.academicYear}</small>
      </div>
      <div className="paper-content">
        <div className="paper-badges">
          <Badge tone="blue">小{paper.grade}</Badge>
          <Badge tone={paper.difficulty === "hard" ? "coral" : "mint"}>{difficultyLabel[paper.difficulty]}</Badge>
          {paper.access !== "free" ? <Badge tone="sun"><LockIcon />會員</Badge> : <Badge tone="gray">免費試用</Badge>}
        </div>
        <h3>{paper.title}</h3>
        <div className="paper-card-meta">
          <span>{paper.questionCount}題</span>
          <span>{paper.pageCount}頁</span>
          <span>約{paper.durationMinutes}分鐘</span>
        </div>
        <div className="paper-readiness">
          <span className={isOnlinePracticeEnabled && !canPractice ? "pending" : "ready"}>{readinessLabel}</span>
          <small>{readinessDescription}</small>
        </div>
        <div className="paper-card-actions">
          <Link className="button button-primary button-small" href={`/papers/${paper.id}`}>預覽及列印</Link>
          {isOnlinePracticeEnabled ? (
            canPractice ? <Link className="button button-secondary button-small" href={`/practice/${paper.id}`}><SparklesIcon />線上練習</Link> : <Link className="card-link" href={`/papers/${paper.id}`}>預覽試卷 →</Link>
          ) : (
            <span className="button button-disabled button-small"><SparklesIcon />{onlinePracticeStatus.pausedLabel}</span>
          )}
        </div>
      </div>
    </article>
  );
}
