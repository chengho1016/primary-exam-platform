import Link from "next/link";
import { LockIcon, PaperIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import type { PaperSummary } from "@/lib/domain/types";

const difficultyLabel = { easy: "基礎", medium: "標準", hard: "進階" } as const;

export function PaperCard({ paper }: { paper: PaperSummary }) {
  return (
    <article className="paper-card">
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
        <p>{paper.academicYear} · {paper.questionCount}題 · 約{paper.durationMinutes}分鐘</p>
        <Link className="card-link" href={`/papers/${paper.id}`}>查看試卷</Link>
      </div>
    </article>
  );
}
