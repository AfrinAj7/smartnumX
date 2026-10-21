import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";

const policyDrafts = {
  terms: {
    title: "Terms of use",
    summary: "This draft describes the topics that final terms should cover. It is not legal advice and must be reviewed before publication.",
    sections: ["Account responsibilities and parent/guardian consent for learners under 18.", "Course access, recorded lesson availability and acceptable use.", "Fees, payments processed through Cashfree, cancellations and refunds.", "Intellectual property, service availability and support contacts."],
  },
  privacy: {
    title: "Privacy notice",
    summary: "This draft needs review against SmartNum's actual data practices and India's Digital Personal Data Protection Act before publication.",
    sections: ["Information collected when a learner or parent requests a demo or creates an account.", "How contact details support counselling, course access and learner updates.", "Retention, access controls, deletion requests and data processor details.", "Parent or guardian consent and protections for learners under 18."],
  },
  refund: {
    title: "Refund and cancellation policy",
    summary: "Refund windows, deductions and exceptions have not been supplied. Confirm the final terms with a qualified adviser before accepting payments.",
    sections: ["[REFUND WINDOW AND ELIGIBILITY TO BE CONFIRMED].", "[CANCELLATION PROCESS AND RESPONSE TIME TO BE CONFIRMED].", "Payments are intended to be processed through Cashfree; final payment and refund rules require review.", "For help, contact [EMAIL TO BE CONFIRMED]."],
  },
} as const;

type PolicySlug = keyof typeof policyDrafts;

export function generateStaticParams() {
  return Object.keys(policyDrafts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policyDrafts[slug as PolicySlug];
  return policy ? { title: policy.title, description: policy.summary } : { title: "Policy not found" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policyDrafts[slug as PolicySlug];
  if (!policy) notFound();

  return (
    <div className="policy-page">
      <SiteHeader />
      <main className="policy-content">
        <span className="section-kicker">Draft · review required</span>
        <h1>{policy.title}</h1>
        <p className="policy-warning">{policy.summary}</p>
        <h2>Topics for the final policy</h2>
        <ul>{policy.sections.map((section) => <li key={section}>{section}</li>)}</ul>
        <p className="policy-warning">This placeholder is not a published policy. Replace and approve it before accepting payments or learner data.</p>
      </main>
      <SiteFooter />
    </div>
  );
}