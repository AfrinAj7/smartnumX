import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { CheckoutView } from "@/web-client/components/checkout/CheckoutView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout & Enrolment | SmartNum",
  description: "Complete your enrolment with our simulated demo payment gateway.",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/checkout");
  }

  const content = await getHomepageContent(db);
  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session.user} />
      <main style={{ flex: 1, padding: "2rem 1rem" }}>
        <CheckoutView user={session.user} />
      </main>
      <SiteFooter contact={contact} />
    </div>
  );
}
