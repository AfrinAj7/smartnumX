import { notFound, redirect } from "next/navigation";
import { SiteContentEditor } from "@/admin/views/SiteContentEditor";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import { getHomepageContent } from "@/server/site-content/homepage";

export const metadata = { title: "Homepage content" };

export default async function SiteContentPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fadmin%2Fsite-content");
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) notFound();

  const initialContent = await getHomepageContent(db);
  return <SiteContentEditor initialContent={initialContent} />;
}