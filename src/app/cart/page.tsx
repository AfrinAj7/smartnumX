import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { CartView } from "@/web-client/components/cart/CartView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Cart | SmartNum",
  description: "Review your selected academic tuition and competitive courses.",
};

export default async function CartPage() {
  const [session, content] = await Promise.all([
    auth(),
    getHomepageContent(db),
  ]);

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session?.user} />
      <main style={{ flex: 1, padding: "2rem 1rem" }}>
        <CartView />
      </main>
      <SiteFooter contact={contact} />
    </div>
  );
}
