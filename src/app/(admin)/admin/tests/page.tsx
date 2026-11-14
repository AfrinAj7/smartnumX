import { TestManagementView } from "@/admin/views/TestManagementView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tests & CBT Mocks | SmartNum Admin",
  description: "Configure Computer-Based Tests, durations, question sections, and mock exams.",
};

export default function AdminTestsPage() {
  return <TestManagementView />;
}

