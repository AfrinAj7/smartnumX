import { Suspense } from "react";
import { AuthForm, type AuthMode } from "./AuthForm";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <Suspense fallback={<main className="auth-loading" aria-busy="true">Loading account form…</main>}>
      <AuthForm mode={mode} googleEnabled={googleEnabled} />
    </Suspense>
  );
}