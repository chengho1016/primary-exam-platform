import type { UserRole } from "@/lib/domain/types";

export type Permission =
  | "practice:take"
  | "paper:print"
  | "child:read"
  | "paper:manage"
  | "user:manage";

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  student: new Set(["practice:take"]),
  parent: new Set(["practice:take", "paper:print", "child:read"]),
  admin: new Set([
    "practice:take",
    "paper:print",
    "child:read",
    "paper:manage",
    "user:manage",
  ]),
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}
