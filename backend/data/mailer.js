import nodemailer from 'nodemailer';

// Outgoing email over SMTP. Works with Gmail (app password), Brevo, Resend, Mailgun and others.
// Without SMTP settings the code is printed in the server console instead, for local testing.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

export const mailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function verifyMailer() {
  if (!transport) return false;
  await transport.verify();
  return true;
}

export async function sendVerificationCode({ to, name, code, appName = 'Daily Commit' }) {
  if (!transport) {
    console.log(`\n[mail] SMTP not set up. Verification code for ${to}: ${code}\n`);
    return { delivered: false };
  }
  const text = `Hi ${name || 'there'},

Your ${appName} verification code is ${code}

It expires in 10 minutes. If you did not try to sign up, you can ignore this email.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#111827">
    <p style="margin:0 0 16px;font-size:15px">Hi ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 24px;font-size:15px">Your ${appName} verification code is</p>
    <p style="margin:0 0 24px;font-family:ui-monospace,Menlo,monospace;font-size:32px;letter-spacing:6px;font-weight:600">${code}</p>
    <p style="margin:0;font-size:13px;color:#4b5565">It expires in 10 minutes. If you did not try to sign up, you can ignore this email.</p>
  </div>`;

  await transport.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: `${code} is your ${appName} verification code`,
    text,
    html,
  });
  return { delivered: true };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
