import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExamResultView } from "@/web-client/components/exam/ExamResultView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Result & Analytics | SmartNuM CBT",
  description: "Comprehensive score report, percentile rank, and chapter-wise performance analysis.",
};

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/tests/${testId}/result/${attemptId}`);
  }

  return (
    <ExamResultView
      testId={testId}
      attemptId={attemptId}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}

