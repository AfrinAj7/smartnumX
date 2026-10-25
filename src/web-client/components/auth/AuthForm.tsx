"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { SmartNumWordmark } from "@/web-client/components/layout/SmartNumWordmark";

export type AuthMode = "sign-in" | "register" | "forgot-password" | "reset-password" | "change-password";

const content: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Pick up where you left off.",
    description: "Sign in to return to your learning space.",
    submit: "Sign in",
  },
  register: {
    eyebrow: "Start learning",
    title: "Make your next step count.",
    description: "Create an account to explore courses and track your progress.",
    submit: "Create account",
  },
  "forgot-password": {
    eyebrow: "Account recovery",
    title: "Let’s get you back in.",
    description: "Enter your email and we’ll send a password reset link if an account matches.",
    submit: "Send reset link",
  },
  "reset-password": {
    eyebrow: "Choose a new password",
    title: "A fresh start.",
    description: "Set a new password for your SmartNum Learning Space account.",
    submit: "Update password",
  },
  "change-password": {
    eyebrow: "Secure your account",
    title: "Set a private password.",
    description: "Change the temporary password before continuing to your workspace.",
    submit: "Change password",
  },
};

function safeDestination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function AuthForm({ mode, googleEnabled = false }: { mode: AuthMode; googleEnabled?: boolean }) {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const details = content[mode];
  const token = searchParams.get("token") ?? "";
  const callbackUrl = safeDestination(searchParams.get("callbackUrl"));
  const verifiedEmail = mode === "sign-in" && searchParams.get("verified") === "1";
  const changedPassword = mode === "sign-in" && searchParams.get("passwordChanged") === "1";
  const urlError = mode === "sign-in" && searchParams.get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback("");
    setError("");
    const values = new FormData(event.currentTarget);

    try {
      if (mode === "sign-in") {
        await signIn("credentials", {
          email: String(values.get("email") ?? "").trim(),
          password: String(values.get("password") ?? ""),
          redirectTo: callbackUrl,
        });
        return;
      }

      if (mode === "reset-password" || mode === "change-password") {
        const password = String(values.get("password") ?? "");
        if (password !== String(values.get("confirmPassword") ?? "")) {
          setError("The passwords do not match.");
          return;
        }
      }

      const endpoints: Record<Exclude<AuthMode, "sign-in">, string> = {
        register: "/api/auth/register",
        "forgot-password": "/api/auth/forgot-password",
        "reset-password": "/api/auth/reset-password",
        "change-password": "/api/auth/change-password",
      };
      const payload: Record<string, string | boolean> = {};
      for (const [key, value] of values.entries()) payload[key] = String(value);
      if (mode === "register") {
        payload.acceptedTerms = values.get("acceptedTerms") === "true";
      }
      if (mode === "reset-password") payload.token = token;

      const response = await fetch(endpoints[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "We couldn’t complete that request. Check the form and try again.");
      } else if (mode === "change-password") {
        await signOut({ redirectTo: "/sign-in?passwordChanged=1" });
      } else {
        const msg = result.data?.message ?? "Your request has been received.";
        setFeedback(msg);
        if (mode === "register") {
          setRegisteredEmail(String(result.data?.email || values.get("email") || ""));
          setShowVerifyModal(true);
        }
      }
    } catch {
      setError("We couldn’t reach the service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setPending(true);
    await signIn("google", { redirectTo: callbackUrl });
    setPending(false);
  }

  return (
    <main className="auth-screen">
      <div className="auth-topline">
        <SmartNumWordmark suffix="Learning Space" />
        <Link className="auth-back" href="/">Back to home</Link>
      </div>

      <div className="auth-layout">
        <section className="auth-intro" aria-labelledby="auth-title">
          <span className="eyebrow">{details.eyebrow}</span>
          <h1 id="auth-title">{details.title}</h1>
          <p>{details.description}</p>
          <div className="auth-note">
            <span className="auth-note-mark" aria-hidden="true">∑</span>
            <span>Build understanding, one clear idea at a time.</span>
          </div>
        </section>

        <section className="auth-panel" aria-label={`${details.submit} form`}>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} />
                <label htmlFor="phone">Phone number <span>(optional)</span></label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" />
              </>
            )}

            {mode !== "reset-password" && mode !== "change-password" && (
              <>
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
              </>
            )}

            {(mode === "sign-in" || mode === "register" || mode === "reset-password" || mode === "change-password") && (
              mode === "change-password" && (
                <>
                  <label htmlFor="currentPassword">Current password</label>
                  <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
                </>
              )
            )}

            {(mode === "sign-in" || mode === "register" || mode === "reset-password" || mode === "change-password") && (
              <>
                <label htmlFor="password">{mode === "reset-password" ? "New password" : "Password"}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </>
            )}

            {(mode === "reset-password" || mode === "change-password") && (
              <>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
              </>
            )}

            {mode === "register" && (
              <label className="auth-consent">
                <input name="acceptedTerms" type="checkbox" value="true" required />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
            )}

            {mode === "reset-password" && !token && (
              <p className="auth-inline-error">Open the reset link from your email to continue.</p>
            )}

            <button className="auth-submit" type="submit" disabled={pending || (mode === "reset-password" && !token)}>
              {pending ? "Please wait…" : details.submit}
            </button>

            {feedback && <p className="auth-success" role="status">{feedback}</p>}
            {verifiedEmail && <p className="auth-success" role="status">Email verified. You can sign in now.</p>}
            {changedPassword && <p className="auth-success" role="status">Password updated. Please sign in again.</p>}
            {error && <p className="auth-inline-error" role="alert">{error}</p>}
            {urlError && !error && (
              <p className="auth-inline-error" role="alert">
                {urlError === "CredentialsSignin"
                  ? "Sign-in failed. Please check your email and password."
                  : "Sign-in failed. Check your details or try again later."}
              </p>
            )}
          </form>

          {mode === "sign-in" && googleEnabled && (
            <button className="auth-google" type="button" onClick={handleGoogleSignIn} disabled={pending}>
              Continue with Google
            </button>
          )}

          <div className="auth-links">
            {mode === "sign-in" && (
              <>
                <Link href="/forgot-password">Forgot password?</Link>
                <span>New to SmartNum? <Link href="/sign-up">Create an account</Link></span>
              </>
            )}
            {mode === "register" && <span>Already have an account? <Link href="/sign-in">Sign in</Link></span>}
            {(mode === "forgot-password" || mode === "reset-password") && <Link href="/sign-in">Return to sign in</Link>}
          </div>
        </section>
      </div>

      <footer className="auth-footer">SmartNum Learning Space</footer>

      {showVerifyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            backgroundColor: "rgba(2, 6, 23, 0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "460px",
              background: "#081528",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "1.25rem",
              padding: "2.25rem 2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)",
              textAlign: "center",
              color: "#f8fafc",
            }}
          >
            <button
              type="button"
              onClick={() => setShowVerifyModal(false)}
              aria-label="Close modal"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "1.25rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.375rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 1.25rem auto",
                borderRadius: "50%",
                background: "rgba(249, 115, 22, 0.15)",
                border: "2px solid rgba(249, 115, 22, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              ✉️
            </div>

            <h2
              id="verify-modal-title"
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: "0.75rem",
                letterSpacing: "-0.01em",
              }}
            >
              Kindly verify your account
            </h2>

            <p
              style={{
                fontSize: "0.975rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
                marginBottom: "1.25rem",
              }}
            >
              A link to verify your account has been sent on your registered email
              {registeredEmail ? (
                <>
                  {" "}
                  <strong style={{ color: "#38bdf8", wordBreak: "break-all" }}>
                    ({registeredEmail})
                  </strong>
                </>
              ) : (
                ""
              )}
              .
            </p>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.625rem",
                padding: "0.85rem 1rem",
                fontSize: "0.825rem",
                color: "#94a3b8",
                textAlign: "left",
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Next step:</strong> Please check your inbox (or spam folder) and click the verification link to activate your account and start your courses.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href={`/sign-in${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                style={{
                  display: "inline-flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.8rem 1.25rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(135deg, #ea580c, #f97316)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
                }}
              >
                Go to Sign In →
              </Link>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#cbd5e1",
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}