import { AuthPage } from "@/web-client/components/auth/AuthPage";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return <AuthPage mode="reset-password" />;
}