import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExamInstructionsView } from "@/web-client/components/exam/ExamInstructionsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examination Instructions | SmartNuM CBT",
  description: "Official computer-based test instructions and candidate declaration.",
};

export default async function TestInstructionsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/tests/${testId}/instructions`);
  }

  return (
    <ExamInstructionsView
      testId={testId}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}

