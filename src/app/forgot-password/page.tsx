import { AuthPage } from "@/web-client/components/auth/AuthPage";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <AuthPage mode="forgot-password" />;
}