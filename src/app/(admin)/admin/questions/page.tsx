import { QuestionBankView } from "@/admin/views/QuestionBankView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question Bank | SmartNum Admin",
  description: "Browse, filter, and author questions with LaTeX math support and full CBT compatibility.",
};

export default function AdminQuestionsPage() {
  return <QuestionBankView />;
}

