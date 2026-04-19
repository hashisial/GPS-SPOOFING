import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPasswordResetEmail({ name, resetUrl }) {
  const safeName = escapeHtml(name || "Operator");
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your GPS Shield password",
    html: `
      <div style="font-family:Arial,sans-serif;background:#08111f;color:#e5eefc;padding:24px">
        <div style="max-width:560px;margin:0 auto;background:#0f1b30;border:1px solid #1d3557;border-radius:16px;padding:32px">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#59d0ff">
            GPS Shield Security
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#ffffff">
            Password reset requested
          </h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#c5d5ee">
            Hello ${safeName},
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#c5d5ee">
            A password reset request was received for your GPS Spoofing Detection Dashboard account.
            If you initiated this request, use the secure link below to set a new password.
          </p>
          <p style="margin:0 0 28px">
            <a href="${safeResetUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;background:#59d0ff;color:#08111f;font-weight:700;text-decoration:none">
              Reset Password
            </a>
          </p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#93a9c9">
            This link expires automatically. If you did not request a reset, you can safely ignore this email.
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6f86a9;word-break:break-all">
            ${safeResetUrl}
          </p>
        </div>
      </div>
    `.trim()
  };
}

async function sendWithResend({ to, subject, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(`Resend email request failed with ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function sendPasswordResetEmail({ user, resetUrl }) {
  const emailPayload = buildPasswordResetEmail({
    name: user.name,
    resetUrl
  });

  if (!env.resendApiKey || !env.emailFrom) {
    logger.warn(
      {
        userId: user.id,
        email: user.email
      },
      "Email delivery is not configured; password reset email was not sent"
    );

    return {
      delivered: false,
      provider: "none"
    };
  }

  await sendWithResend({
    to: user.email,
    ...emailPayload
  });

  logger.info(
    {
      userId: user.id,
      email: user.email,
      provider: "resend"
    },
    "Password reset email sent"
  );

  return {
    delivered: true,
    provider: "resend"
  };
}
