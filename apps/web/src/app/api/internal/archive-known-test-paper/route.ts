import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

const EXPECTED_TOKEN_HASH = "0c238fb2044812a978343d3326511eee05be8c7b330df2d2441d410b31f14aa8";

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
