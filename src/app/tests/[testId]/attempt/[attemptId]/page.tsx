import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CbtPlayerView } from "@/web-client/components/exam/CbtPlayerView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examination Player | SmartNuM CBT",
  description: "Secure computer-based test session with real-time response capture and integrity monitoring.",
};

export default async function TestAttemptPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/tests/${testId}/attempt/${attemptId}`);
  }

  return (
    <CbtPlayerView
      testId={testId}
      attemptId={attemptId}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}

