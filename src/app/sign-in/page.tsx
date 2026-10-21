import { AuthPage } from "@/web-client/components/auth/AuthPage";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return <AuthPage mode="sign-in" />;
}