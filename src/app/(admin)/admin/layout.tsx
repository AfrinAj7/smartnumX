import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/web-client/components/layout/WorkspaceShell";
import { auth, signOut } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fadmin");
  if (session.user.status !== "ACTIVE") {
    await signOut({ redirectTo: "/sign-in?error=suspended" });
  }
  if (session.user.mustChangePassword) redirect("/change-password");
  if (!hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR"])) redirect("/dashboard");

  return (
    <WorkspaceShell role={session.user.role} name={session.user.name ?? session.user.email ?? "Team member"}>
      {children}
    </WorkspaceShell>
  );
}