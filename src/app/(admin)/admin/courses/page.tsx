import { CourseManagementView } from "@/admin/views/CourseManagementView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Management | SmartNum Admin",
  description: "Create, price, and manage courses, curriculum, and publishing status.",
};

export default function AdminCoursesPage() {
  return <CourseManagementView />;
}
