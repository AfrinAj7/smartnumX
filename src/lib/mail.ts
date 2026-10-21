import type { AuthMailer } from "@/server/auth/auth-service";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function sendLinkEmail(input: {
  to: string;
  name: string;
  subject: string;
  route: string;
  token: string;
  action: string;
}) {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("APP_URL or NEXTAUTH_URL must be configured.");

  const link = new URL(input.route, baseUrl);
  link.searchParams.set("token", input.token);
  const safeName = escapeHtml(input.name);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: `Hi ${input.name},\n\n${input.action}: ${link.toString()}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hi ${safeName},</p><p><a href="${link.toString()}">${input.action}</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Email delivery failed.");
}

export const authMailer: AuthMailer = {
  sendVerification(email, name, token) {
    return sendLinkEmail({
      to: email,
      name,
      subject: "Verify your SmartNum email",
      route: "/api/auth/verify-email",
      token,
      action: "Verify your email",
    });
  },
  sendPasswordReset(email, name, token) {
    return sendLinkEmail({
      to: email,
      name,
      subject: "Reset your SmartNum password",
      route: "/reset-password",
      token,
      action: "Reset your password",
    });
  },
};