import { notFound, redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice-session";
import { hasPaperAccess } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { getPublishedPaperDetails } from "@/lib/papers/paper-repository";
import { getPracticeQuestionPool } from "@/lib/practice/practice-repository";

export const metadata = { title: "15題智能練習" };

export default async function PracticePage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const user = await requireUser();
  const paper = await getPublishedPaperDetails(paperId);
  if (!paper) notFound();
  if (!(await hasPaperAccess(user.id, paperId))) redirect("/membership");
  const questionPool = await getPracticeQuestionPool(paperId);
  if (questionPool.length < 15) notFound();
  return <PracticeSession paperId={paperId} paperTitle={paper.summary.title} questionPool={questionPool} />;
}
