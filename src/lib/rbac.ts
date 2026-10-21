export type AppRole = "SUPER_ADMIN" | "INSTRUCTOR" | "STUDENT";

export type Actor = {
  id: string;
  role: AppRole;
};

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "ForbiddenError";
  }
}

export function hasRole(
  actor: Actor | null | undefined,
  allowedRoles: readonly AppRole[],
): actor is Actor {
  return Boolean(actor && allowedRoles.includes(actor.role));
}

export function assertRole(
  actor: Actor | null | undefined,
  allowedRoles: readonly AppRole[],
): asserts actor is Actor {
  if (!hasRole(actor, allowedRoles)) {
    throw new ForbiddenError();
  }
}

export function canManageCourse(
  actor: Actor,
  instructorId: string | null,
): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  return actor.role === "INSTRUCTOR" && actor.id === instructorId;
}