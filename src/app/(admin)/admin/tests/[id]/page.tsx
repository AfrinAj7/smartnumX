import { TestBuilderView } from "@/admin/views/TestBuilderView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Builder & Questions | SmartNum Admin",
  description: "Assemble sections, allocate questions from Question Bank, and set CBT scoring rules.",
};

export default async function AdminTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TestBuilderView testId={id} />;
}

