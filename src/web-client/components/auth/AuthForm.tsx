"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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
  const [manualEmail, setManualEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const details = content[mode];
  const token = searchParams.get("token") ?? "";
  const callbackUrl = safeDestination(searchParams.get("callbackUrl"));
  const verifiedEmail = mode === "sign-in" && searchParams.get("verified") === "1";
  const changedPassword = mode === "sign-in" && searchParams.get("passwordChanged") === "1";
  const urlError = mode === "sign-in" && searchParams.get("error");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const activeEmail = registeredEmail || manualEmail;

  async function handleVerifyOtp(event?: FormEvent) {
    if (event) event.preventDefault();
    const cleanCode = otpCode.trim().replace(/\s+/g, "");
    const cleanEmail = activeEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setOtpError("Please enter your registered email address.");
      return;
    }
    if (cleanCode.length !== 6) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setOtpError(data.error || "Invalid or expired verification code.");
        setOtpVerifying(false);
        return;
      }

      setOtpSuccess("Email verified successfully! Redirecting to sign in…");
      setTimeout(() => {
        window.location.href = `/sign-in?verified=1${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      }, 1200);
    } catch (err) {
      console.error("[VERIFY OTP ERROR]", err);
      setOtpError("Unable to reach verification service. Please try again.");
      setOtpVerifying(false);
    }
  }

  async function handleResendOtp() {
    const cleanEmail = activeEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setOtpError("Please enter your registered email address.");
      return;
    }
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await response.json();

      if (data.alreadyVerified) {
        setOtpSuccess("This email is already verified! Redirecting to sign in…");
        setTimeout(() => {
          window.location.href = "/sign-in?verified=1";
        }, 1200);
        return;
      }

      setOtpSuccess(data.message || "A new 6-digit verification code has been sent to your email.");
      setResendCooldown(30);
    } catch (err) {
      console.error("[RESEND OTP ERROR]", err);
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback("");
    setError("");
    const values = new FormData(event.currentTarget);

    try {
      if (mode === "sign-in") {
        const email = String(values.get("email") ?? "").trim();
        const password = String(values.get("password") ?? "");

        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
          redirectTo: callbackUrl,
        });

        if (!res || res.error || !res.ok) {
          setError("Incorrect email or password. Please check your credentials and try again.");
          setPending(false);
          return;
        }

        // Successfully authenticated! Navigate to destination on current host
        window.location.href = callbackUrl;
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
        try {
          await signOut({ redirect: false });
        } catch {
          // ignore error
        }
        window.location.href = "/sign-in?passwordChanged=1";
      } else {
        const msg = result.data?.message ?? "Your request has been received.";
        setFeedback(msg);
        if (mode === "register") {
          const emailVal = String(result.data?.email || values.get("email") || "");
          setRegisteredEmail(emailVal);
          setManualEmail(emailVal);
          setOtpCode("");
          setOtpError("");
          setOtpSuccess("");
          setShowVerifyModal(true);
        }
      }
    } catch (err) {
      console.error("[AUTH SUBMIT ERROR]", err);
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
            {verifiedEmail && <p className="auth-success" role="status">Email verified! You can sign in now.</p>}
            {changedPassword && <p className="auth-success" role="status">Password updated. Please sign in again.</p>}
            {error && <p className="auth-inline-error" role="alert">{error}</p>}
            {urlError && !error && (
              <p className="auth-inline-error" role="alert">
                {urlError === "CredentialsSignin"
                  ? "Incorrect email or password. Please check your credentials and try again."
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
            backgroundColor: "rgba(2, 6, 23, 0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "480px",
              background: "#081528",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)",
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
                width: "56px",
                height: "56px",
                margin: "0 auto 1rem auto",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.15)",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
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
                marginBottom: "0.5rem",
                letterSpacing: "-0.01em",
              }}
            >
              Verify Your Account
            </h2>

            <p
              style={{
                fontSize: "0.925rem",
                color: "#cbd5e1",
                lineHeight: 1.5,
                marginBottom: "1rem",
              }}
            >
              Enter the 6-digit verification code sent to your email
              {activeEmail ? (
                <>
                  <br />
                  <strong style={{ color: "#38bdf8", wordBreak: "break-all" }}>
                    ({activeEmail})
                  </strong>
                </>
              ) : null}
            </p>

            {!registeredEmail && (
              <div style={{ marginBottom: "1rem", textAlign: "left" }}>
                <label
                  htmlFor="verify-manual-email"
                  style={{ display: "block", fontSize: "0.825rem", color: "#94a3b8", marginBottom: "0.25rem" }}
                >
                  Registered Email Address
                </label>
                <input
                  id="verify-manual-email"
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "0.5rem",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ marginTop: "0.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="otp-code-input"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem",
                  }}
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="otp-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(val);
                  }}
                  placeholder="••••••"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    maxWidth: "260px",
                    margin: "0 auto",
                    display: "block",
                    textAlign: "center",
                    fontSize: "1.75rem",
                    letterSpacing: "0.35em",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "2px solid #0284c7",
                    borderRadius: "0.625rem",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    outline: "none",
                    boxShadow: "0 0 15px rgba(2, 132, 199, 0.25)",
                  }}
                />
              </div>

              {otpError && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0.5rem 0", fontWeight: 500 }}>
                  {otpError}
                </p>
              )}
              {otpSuccess && (
                <p style={{ color: "#4ade80", fontSize: "0.85rem", margin: "0.5rem 0", fontWeight: 600 }}>
                  {otpSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={otpVerifying || otpCode.length !== 6 || !activeEmail}
                style={{
                  display: "inline-flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  background:
                    otpCode.length === 6 && activeEmail
                      ? "linear-gradient(135deg, #0284c7, #0ea5e9)"
                      : "rgba(2, 132, 199, 0.35)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: otpCode.length === 6 && !otpVerifying && activeEmail ? "pointer" : "not-allowed",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                  marginTop: "0.5rem",
                }}
              >
                {otpVerifying ? "Verifying…" : "Verify Code →"}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
                fontSize: "0.85rem",
              }}
            >
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending || !activeEmail}
                style={{
                  background: "transparent",
                  border: "none",
                  color: resendCooldown > 0 || !activeEmail ? "#64748b" : "#38bdf8",
                  cursor: resendCooldown > 0 || resending || !activeEmail ? "not-allowed" : "pointer",
                  padding: 0,
                  textDecoration: resendCooldown > 0 || !activeEmail ? "none" : "underline",
                }}
              >
                {resending
                  ? "Sending…"
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Dismiss
              </button>
            </div>

            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.625rem",
                padding: "0.75rem 1rem",
                fontSize: "0.8rem",
                color: "#94a3b8",
                textAlign: "left",
                marginTop: "1.25rem",
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Prefer a link?</strong> You can also activate your account by clicking the 1-click verification link sent to your inbox.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
