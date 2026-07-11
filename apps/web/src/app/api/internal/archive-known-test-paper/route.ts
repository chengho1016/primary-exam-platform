import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

const EXPECTED_TOKEN_HASH = "b8e4428277d013c599d04bfe49656ab9b362d1729a5afc57e61631df98ceb4ee";

function hasValidToken(value: string | null) {
  if (!value) return false;
  const actual = Buffer.from(createHash("sha256").update(value).digest("hex"));
  const expected = Buffer.from(EXPECTED_TOKEN_HASH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!hasValidToken(request.headers.get("x-cleanup-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.paper.updateMany({
    where: { title: "撐112233", status: "PUBLISHED" },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ archived: result.count });
}
