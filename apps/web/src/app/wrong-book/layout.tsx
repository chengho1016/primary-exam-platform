import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";

export default async function WrongBookLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}
