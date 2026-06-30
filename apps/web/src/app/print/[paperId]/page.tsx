import { notFound, redirect } from "next/navigation";
import { PrintPreview } from "@/components/print-preview";
import { hasPaperAccess } from "@/lib/auth/entitlements";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { getPublishedPaperDetails } from "@/lib/papers/paper-repository";

export const metadata = { title: "水印列印預覽" };

export default async function PrintPage({ params, searchParams }: { params: Promise<{ paperId: string }>; searchParams: Promise<{ job?: string }> }) {
  const { paperId } = await params;
  const { job: authorization } = await searchParams;
  const user = await requireUser();
  const paper = await getPublishedPaperDetails(paperId);
  if (!paper || !paper.canPrint) notFound();
  if (!(await hasPaperAccess(user.id, paperId))) redirect("/membership");
  if (!authorization) redirect(`/papers/${paperId}`);

  const printJob = await db.printJob.findFirst({
    where: { authorization, paperId, userId: user.id, expiresAt: { gt: new Date() } },
    select: { watermarkText: true },
  });
  if (!printJob) redirect(`/papers/${paperId}`);

  return <PrintPreview authorization={authorization} paperId={paperId} watermarkText={printJob.watermarkText} />;
}
