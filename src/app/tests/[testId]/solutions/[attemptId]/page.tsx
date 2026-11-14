import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExamSolutionsView } from "@/web-client/components/exam/ExamSolutionsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Step-by-step Solutions | SmartNuM CBT",
  description: "Detailed mathematical solutions and verified answer keys for your test attempt.",
};

export default async function TestSolutionsPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/tests/${testId}/solutions/${attemptId}`);
  }

  return (
    <ExamSolutionsView
      testId={testId}
      attemptId={attemptId}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}

