import { redirect } from "next/navigation";

export default async function TestEntryPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  redirect(`/tests/${testId}/instructions`);
}

