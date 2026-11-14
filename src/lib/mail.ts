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

async function createSmtpTransporter(port: number) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || process.env.SEED_ADMIN_EMAIL || "gosmartnum@gmail.com";
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASSWORD;

  if (!rawPass || !user) return null;
  const pass = rawPass.replace(/\s+/g, "");

  const nodemailerModule = await import("nodemailer");
  const nodemailer = nodemailerModule.default || nodemailerModule;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export function getMailBaseUrl(): string {
  const envUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }
  return (envUrl || "http://localhost:3000").replace(/\/$/, "");
}

async function sendLinkEmail(input: {
  to: string;
  name: string;
  subject: string;
  route: string;
  token: string;
  action: string;
  otp?: string;
}) {
  const baseUrl = getMailBaseUrl();
  const link = new URL(input.route, baseUrl);
  if (input.otp) {
    link.searchParams.set("code", input.otp);
    link.searchParams.set("email", input.to);
  } else {
    link.searchParams.set("token", input.token);
  }
  const safeName = escapeHtml(input.name);

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.SEED_ADMIN_EMAIL || "gosmartnum@gmail.com";
  const from = fromEmail.includes("<") ? fromEmail : `"SmartNum Learning Space" <${fromEmail}>`;

  const isOtpVerification = Boolean(input.otp);

  const textBody = isOtpVerification
    ? `Hi ${input.name},\n\nYour SmartNum email verification code is: ${input.otp}\n\nEnter this 6-digit code on the website or verify directly by clicking the link below:\n${link.toString()}\n\nThis code expires in 30 minutes.\n\nIf you did not create this account, you can safely ignore this email.`
    : `Hi ${input.name},\n\n${input.action}: ${link.toString()}\n\nIf you did not request this, you can ignore this email.`;

  const htmlBody = isOtpVerification
    ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">SmartNum Learning Space</h2>
          <p style="color: #38bdf8; font-weight: bold; margin: 4px 0 0; font-size: 13px;">Email Verification Code</p>
        </div>
        <p>Hi ${safeName},</p>
        <p>Thank you for registering with SmartNum. Please enter the 6-digit verification code below to activate your account:</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Verification Code</p>
          <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #0284c7; border-radius: 8px; padding: 14px 28px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0369a1;">
            ${escapeHtml(input.otp!)}
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">This code is valid for 30 minutes.</p>
        </div>

        <p style="margin: 24px 0; text-align: center;">
          <a href="${link.toString()}" style="background-color: #0284c7; color: #ffffff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Verify with 1-Click →
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b; text-align: center;">Or copy this link into your browser:<br/><a href="${link.toString()}" style="color: #0284c7;">${link.toString()}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">If you did not create this account, you can safely ignore this email.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">SmartNum Learning Space</h2>
        <p>Hi ${safeName},</p>
        <p>${input.action}: Please click the button below to proceed:</p>
        <p style="margin: 25px 0;">
          <a href="${link.toString()}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            ${escapeHtml(input.action)} →
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Or copy this link into your browser:<br/><a href="${link.toString()}" style="color: #2563eb;">${link.toString()}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

  // 1. Prioritize SMTP (default port 465 SSL, fallback to 587 STARTTLS)
  const defaultPort = Number(process.env.SMTP_PORT || 465);
  const fallbackPort = defaultPort === 465 ? 587 : 465;

  const transporter = await createSmtpTransporter(defaultPort);
  if (transporter) {
    try {
      console.info(`[SMTP] Sending "${input.subject}" to ${input.to} via port ${defaultPort}...`);
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: textBody,
        html: htmlBody,
      });
      console.info(`[SMTP] Successfully delivered "${input.subject}" to ${input.to}`);
      return;
    } catch (smtpError) {
      console.warn(`[SMTP WARN] Port ${defaultPort} failed, attempting port ${fallbackPort} fallback:`, smtpError);
      try {
        const fallbackTransporter = await createSmtpTransporter(fallbackPort);
        if (fallbackTransporter) {
          await fallbackTransporter.sendMail({
            from,
            to: input.to,
            subject: input.subject,
            text: textBody,
            html: htmlBody,
          });
          console.info(`[SMTP] Successfully delivered "${input.subject}" to ${input.to} via fallback port ${fallbackPort}`);
          return;
        }
      } catch (fallbackError) {
        console.error(`[SMTP ERROR] Fallback port ${fallbackPort} also failed:`, fallbackError);
      }
    }
  }

  // 2. Check Resend API if configured
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
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
          text: textBody,
          html: htmlBody,
        }),
      });
      if (response.ok) {
        console.info(`[RESEND] Successfully sent email to ${input.to}`);
        return;
      }
    } catch (resendErr) {
      console.error("[RESEND ERROR]", resendErr);
    }
  }

  // 3. Fallback: Log for developer inspection (NO AUTO-VERIFY)
  console.info(
    `\n======================================================\n` +
    `[EMAIL SIMULATION FALLBACK]\n` +
    `To: ${input.to}\n` +
    `Subject: ${input.subject}\n` +
    (input.otp ? `OTP Code: ${input.otp}\n` : "") +
    `Link: ${link.toString()}\n` +
    `======================================================\n`
  );
}

export const authMailer: AuthMailer = {
  sendVerification(email, name, token, otp) {
    const code = otp || (token && token.length <= 8 && /^\d+$/.test(token) ? token : undefined);
    return sendLinkEmail({
      to: email,
      name,
      subject: "Verify your SmartNum email",
      route: "/api/auth/verify-email",
      token,
      action: "Verify your email",
      otp: code,
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

export async function sendOrderReceiptEmail(input: {
  to: string;
  name: string;
  invoiceNo: string;
  total: number;
  items: string[];
  orderId: string;
}) {
  const baseUrl = getMailBaseUrl();
  const invoiceUrl = `${baseUrl}/orders/${input.orderId}`;
  const portalUrl = `${baseUrl}/dashboard`;
  const safeName = escapeHtml(input.name || "Student");

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.SEED_ADMIN_EMAIL || "gosmartnum@gmail.com";
  const from = fromEmail.includes("<") ? fromEmail : `"SmartNum Learning Space" <${fromEmail}>`;
  const subject = `Enrolment Confirmed: Invoice #${input.invoiceNo} | SmartNum`;

  const itemsHtml = input.items.map((i) => `<li><strong>${escapeHtml(i)}</strong></li>`).join("");

  const defaultPort = Number(process.env.SMTP_PORT || 465);
  const fallbackPort = defaultPort === 465 ? 587 : 465;

  const transporter = await createSmtpTransporter(defaultPort);
  if (transporter) {
    try {
      console.info(`[SMTP] Sending receipt for ${input.invoiceNo} to ${input.to}...`);
      await transporter.sendMail({
        from,
        to: input.to,
        subject,
        text: `Hi ${input.name},\n\nYour enrolment is confirmed!\nInvoice No: ${input.invoiceNo}\nTotal Paid: ₹${input.total.toLocaleString("en-IN")}\nProgrammes: ${input.items.join(", ")}\n\nAccess your learning dashboard: ${portalUrl}\nView invoice receipt: ${invoiceUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px;">SmartNum Learning Space</h2>
              <p style="color: #ea580c; font-weight: bold; margin: 4px 0 0; font-size: 13px;">Enrolment &amp; Payment Confirmation</p>
            </div>
            <p>Dear ${safeName},</p>
            <p>Congratulations! Your enrolment has been successfully processed and your learning portal is now active.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>Invoice Number:</strong> ${escapeHtml(input.invoiceNo)}</p>
              <p style="margin: 0 0 8px;"><strong>Total Paid:</strong> ₹${input.total.toLocaleString("en-IN")}</p>
              <p style="margin: 0 0 8px;"><strong>Enrolled Programmes:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                ${itemsHtml}
              </ul>
            </div>
            <p style="margin: 25px 0;">
              <a href="${portalUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Access My Courses &amp; Tests →
              </a>
            </p>
            <p style="font-size: 13px; color: #64748b;">You can also view or download your invoice receipt anytime at: <br/><a href="${invoiceUrl}" style="color: #2563eb;">${invoiceUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">SmartNum Learning Centre: 04224, ATS Advantage, Indirapuram, Ghaziabad, UP · +91 99589 47774</p>
          </div>
        `,
      });
      console.info(`[SMTP] Successfully delivered receipt for ${input.invoiceNo} to ${input.to}`);
      return;
    } catch (smtpError) {
      console.warn(`[SMTP WARN] Receipt port ${defaultPort} failed, trying port ${fallbackPort}:`, smtpError);
      try {
        const fallbackTransporter = await createSmtpTransporter(fallbackPort);
        if (fallbackTransporter) {
          await fallbackTransporter.sendMail({
            from,
            to: input.to,
            subject,
            text: `Hi ${input.name},\n\nYour enrolment is confirmed!\nInvoice No: ${input.invoiceNo}\nTotal Paid: ₹${input.total.toLocaleString("en-IN")}\nProgrammes: ${input.items.join(", ")}\n\nAccess your learning dashboard: ${portalUrl}\nView invoice receipt: ${invoiceUrl}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 20px;">SmartNum Learning Space</h2>
                  <p style="color: #ea580c; font-weight: bold; margin: 4px 0 0; font-size: 13px;">Enrolment &amp; Payment Confirmation</p>
                </div>
                <p>Dear ${safeName},</p>
                <p>Congratulations! Your enrolment has been successfully processed and your learning portal is now active.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0 0 8px;"><strong>Invoice Number:</strong> ${escapeHtml(input.invoiceNo)}</p>
                  <p style="margin: 0 0 8px;"><strong>Total Paid:</strong> ₹${input.total.toLocaleString("en-IN")}</p>
                  <p style="margin: 0 0 8px;"><strong>Enrolled Programmes:</strong></p>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${itemsHtml}
                  </ul>
                </div>
                <p style="margin: 25px 0;">
                  <a href="${portalUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Access My Courses &amp; Tests →
                  </a>
                </p>
                <p style="font-size: 13px; color: #64748b;">You can also view or download your invoice receipt anytime at: <br/><a href="${invoiceUrl}" style="color: #2563eb;">${invoiceUrl}</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">SmartNum Learning Centre: 04224, ATS Advantage, Indirapuram, Ghaziabad, UP · +91 99589 47774</p>
              </div>
            `,
          });
          console.info(`[SMTP] Successfully delivered receipt for ${input.invoiceNo} to ${input.to} via fallback port ${fallbackPort}`);
          return;
        }
      } catch (fallbackError) {
        console.error("[SMTP ERROR] Failed to send receipt via fallback SMTP:", fallbackError);
      }
    }
  }

  // Resend or console simulation
  console.info(
    `\n======================================================\n` +
    `[ORDER RECEIPT EMAIL SIMULATION]\n` +
    `To: ${input.to}\n` +
    `Invoice: ${input.invoiceNo}\n` +
    `Total: ₹${input.total}\n` +
    `Programmes: ${input.items.join(", ")}\n` +
    `Portal Link: ${portalUrl}\n` +
    `======================================================\n`
  );
}
