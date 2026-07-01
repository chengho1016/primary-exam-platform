import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function parseDataUri(dataUri: string) {
  const prefixMatch = dataUri.match(/^data:([^;,]+);base64,/);
  if (!prefixMatch?.[1]) return undefined;
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return undefined;
  return { contentType: prefixMatch[1], buffer: Buffer.from(dataUri.slice(commaIndex + 1), "base64") };
}

export async function GET(request: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { paperId } = await params;
  const authorization = new URL(request.url).searchParams.get("job");
  if (!authorization) return new Response("Print authorization required", { status: 403 });

  const [paper, printJob] = await Promise.all([
    db.paper.findFirst({
      where: { id: paperId, status: "PUBLISHED" },
      select: { code: true, sourceAssetPath: true },
    }),
    db.printJob.findFirst({
      where: { authorization, paperId, userId: user.id, expiresAt: { gt: new Date() } },
      select: { id: true, status: true },
    }),
  ]);

  if (!paper) notFound();
  if (!printJob) return new Response("Print authorization expired", { status: 403 });

  const source = parseDataUri(paper.sourceAssetPath);
  if (!source) notFound();

  if (printJob.status === "CREATED") {
    await db.printJob.update({ where: { id: printJob.id }, data: { status: "PRINTED", printedAt: new Date() } });
  }

  const extension = source.contentType === "application/pdf" ? "pdf" : source.contentType === "image/png" ? "png" : source.contentType === "image/jpeg" ? "jpg" : "bin";
  return new Response(new Uint8Array(source.buffer), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${paper.code}.${extension}"`,
      "Content-Type": source.contentType,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
