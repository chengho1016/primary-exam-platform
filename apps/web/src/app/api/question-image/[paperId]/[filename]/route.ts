import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const PAPER_ID = "2324-03-MA-P4";
const ALLOWED_FILENAME = /^(q\d{2}|stimulus-q38-q42)\.png$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paperId: string; filename: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { paperId, filename } = await params;
  if (paperId !== PAPER_ID || !ALLOWED_FILENAME.test(filename)) notFound();

  const image = await readFile(
    path.join(process.cwd(), "src", "content", PAPER_ID, "questions", filename),
  );

  return new Response(new Uint8Array(image), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
