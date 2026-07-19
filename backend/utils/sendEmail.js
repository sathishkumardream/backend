const nodemailer = require("nodemailer");

/**
 * Reads SMTP settings from environment variables so this works with any provider
 * that speaks standard SMTP — Gmail (with an App Password), Brevo, SendGrid, etc.
 *
 * Required env vars:
 *   EMAIL_HOST      e.g. smtp.gmail.com
 *   EMAIL_PORT      e.g. 587
 *   EMAIL_USER      the account/login used to authenticate with the SMTP server
 *   EMAIL_PASS      the password / app password / API key for that account
 *   EMAIL_FROM      the "from" address shown to recipients (often same as EMAIL_USER)
 *
 * If these aren't set, sendEmail logs a warning and skips sending instead of crashing —
 * so the rest of the app keeps working even before email is configured.
 */
function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465, // true for port 465, false for 587/others (STARTTLS)
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `⚠️  Email not sent (SMTP not configured): "${subject}" to ${to}. ` +
      `Set EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS/EMAIL_FROM to enable real emails.`
    );
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { sendEmail };
