import { describe, expect, it } from "vitest";
import { assertRole, canManageCourse, ForbiddenError } from "./rbac";

describe("role-based access control", () => {
  it("allows actors with an explicitly permitted role", () => {
    expect(() =>
      assertRole({ id: "student-1", role: "STUDENT" }, ["STUDENT"]),
    ).not.toThrow();
  });

  it("rejects missing actors and roles outside the allowlist", () => {
    expect(() => assertRole(null, ["SUPER_ADMIN"])).toThrow(ForbiddenError);
    expect(() =>
      assertRole({ id: "student-1", role: "STUDENT" }, ["INSTRUCTOR"]),
    ).toThrow(ForbiddenError);
  });

  it("limits instructors to their assigned courses", () => {
    expect(canManageCourse({ id: "instructor-1", role: "INSTRUCTOR" }, "instructor-1")).toBe(true);
    expect(canManageCourse({ id: "instructor-1", role: "INSTRUCTOR" }, "instructor-2")).toBe(false);
    expect(canManageCourse({ id: "student-1", role: "STUDENT" }, "instructor-1")).toBe(false);
  });

  it("lets super admins manage any course", () => {
    expect(canManageCourse({ id: "admin-1", role: "SUPER_ADMIN" }, null)).toBe(true);
  });
});