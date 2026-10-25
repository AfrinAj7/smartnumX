import { EnrollmentManagementView } from "@/admin/views/EnrollmentManagementView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learners & Enrolments | SmartNum Admin",
  description: "View and manage student course enrollments and access validity.",
};

export default function AdminEnrollmentsPage() {
  return <EnrollmentManagementView />;
}
