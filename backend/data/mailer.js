import nodemailer from 'nodemailer';

// Outgoing email. Three ways, tried in this order:
//   1. BREVO_API_KEY   - Brevo HTTP API (port 443). Free 300/day, any recipient once the sender is verified.
//   2. RESEND_API_KEY  - Resend HTTP API (port 443). Needs a verified domain to email other people.
//   3. SMTP_*          - plain SMTP. Fine locally, but many hosts (Render free tier included) block
//                        outbound ports 25/465/587, which shows up as "Connection timeout".
// With none of these set, the code is printed in the server console instead, for local testing.
const { BREVO_API_KEY, RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

export const mailProvider = BREVO_API_KEY ? 'brevo' : RESEND_API_KEY ? 'resend' : (SMTP_HOST && SMTP_USER && SMTP_PASS) ? 'smtp' : null;
export const mailConfigured = Boolean(mailProvider);

const transport = mailProvider === 'smtp'
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })
  : null;

/** Parse "Name <email@x.com>" or "email@x.com" */
function parseFrom(value) {
  const raw = (value || SMTP_USER || '').trim();
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { email: raw };
}

export async function verifyMailer() {
  if (!mailProvider) return false;
  if (!parseFrom(MAIL_FROM).email) throw new Error('MAIL_FROM is not set');
  if (mailProvider === 'smtp') await transport.verify();
  if (mailProvider === 'brevo') {
    const res = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': BREVO_API_KEY, accept: 'application/json' } });
    if (!res.ok) throw new Error(`Brevo API key rejected (${res.status})`);
  }
  // Resend has no cheap "check key" call that works with send-only keys, so it is checked on first send
  return true;
}

async function deliver({ to, subject, text, html }) {
  const from = parseFrom(MAIL_FROM);

  if (mailProvider === 'brevo') {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: from, to: [{ email: to }], subject, textContent: text, htmlContent: html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    return;
  }

  if (mailProvider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }

  await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text, html });
}

export async function sendVerificationCode({ to, name, code, appName = 'Daily Commit' }) {
  if (!mailProvider) {
    console.log(`\n[mail] Email not set up. Verification code for ${to}: ${code}\n`);
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

  await deliver({ to, subject: `${code} is your ${appName} verification code`, text, html });
  return { delivered: true };
}

export async function sendPasswordResetCode({ to, name, code, appName = 'Daily Commit' }) {
  if (!mailProvider) {
    console.log(`\n[mail] Email not set up. Password reset code for ${to}: ${code}\n`);
    return { delivered: false };
  }
  const text = `Hi ${name || 'there'},

Your ${appName} password reset code is ${code}

It expires in 10 minutes. If you did not ask to reset your password, you can ignore this email and your password stays the same.`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#111827">
    <p style="margin:0 0 16px;font-size:15px">Hi ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 24px;font-size:15px">Your ${appName} password reset code is</p>
    <p style="margin:0 0 24px;font-family:ui-monospace,Menlo,monospace;font-size:32px;letter-spacing:6px;font-weight:600">${code}</p>
    <p style="margin:0;font-size:13px;color:#4b5565">It expires in 10 minutes. If you did not ask to reset your password, you can ignore this email and your password stays the same.</p>
  </div>`;

  await deliver({ to, subject: `${code} is your ${appName} password reset code`, text, html });
  return { delivered: true };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
