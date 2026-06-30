import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const PAPER_ID = "2324-03-MA-P4";
const PAGE_COUNT = 12;

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createWatermark(width: number, height: number, watermarkText: string) {
  const rows = Array.from({ length: 7 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) => {
      const x = column * 430 - 160;
      const y = row * 230 + 70;
      return `<text x="${x}" y="${y}" transform="rotate(-24 ${x} ${y})">${escapeXml(watermarkText)}</text>`;
    }).join(""),
  ).join("");

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{fill:#315b82;fill-opacity:.12;font:700 24px Arial,sans-serif;letter-spacing:1px}</style>${rows}</svg>`,
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string; pageNumber: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { paperId, pageNumber } = await params;
  const page = Number(pageNumber);
  if (paperId !== PAPER_ID || !Number.isInteger(page) || page < 1 || page > PAGE_COUNT) notFound();

  const authorization = new URL(request.url).searchParams.get("job");
  const printJob = authorization ? await db.printJob.findFirst({
    where: { authorization, paperId, userId: user.id, expiresAt: { gt: new Date() } },
  }) : undefined;
  if (!printJob) return new Response("Print authorization expired", { status: 403 });

  const source = await readFile(
    path.join(process.cwd(), "src", "content", PAPER_ID, "print-pages", `page-${String(page).padStart(2, "0")}.jpg`),
  );
  const metadata = await sharp(source).metadata();
  const watermarkedPage = await sharp(source)
    .composite([{ input: createWatermark(metadata.width ?? 992, metadata.height ?? 1404, printJob.watermarkText) }])
    .jpeg({ quality: 88 })
    .toBuffer();

  if (printJob.status === "CREATED") {
    await db.printJob.update({ where: { id: printJob.id }, data: { status: "PRINTED", printedAt: new Date() } });
  }

  return new Response(new Uint8Array(watermarkedPage), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="print-preview-${page}.jpg"`,
      "Content-Type": "image/jpeg",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
