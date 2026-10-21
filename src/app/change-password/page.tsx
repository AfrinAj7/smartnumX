import { redirect } from "next/navigation";
import { AuthPage } from "@/web-client/components/auth/AuthPage";
import { auth, signOut } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fchange-password");
  if (session.user.status !== "ACTIVE") {
    await signOut({ redirectTo: "/sign-in?error=suspended" });
  }
  if (!hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR", "STUDENT"])) redirect("/sign-in");
  if (!session.user.mustChangePassword) {
    redirect(session.user.role === "STUDENT" ? "/dashboard" : "/admin");
  }
  return <AuthPage mode="change-password" />;
}