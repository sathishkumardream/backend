/**
 * Sends transactional email via Brevo's HTTP API (https://api.brevo.com).
 *
 * Why an HTTP API instead of SMTP: many cloud hosts (including some Railway plans)
 * block outbound SMTP ports (25/587) to prevent spam abuse, which makes SMTP-based
 * email unreliable or silently hang. An HTTPS API call on port 443 avoids that
 * entirely and fails fast with a clear error instead of hanging.
 *
 * Required env vars:
 *   BREVO_API_KEY     from https://app.brevo.com/settings/keys/api
 *   EMAIL_FROM_NAME    e.g. "Elma's Fashion"
 *   EMAIL_FROM_ADDRESS must be a sender verified in your Brevo account
 *                       (Brevo dashboard → Senders, Domains & Dedicated IPs)
 *
 * If these aren't set, sendEmail logs a warning and skips sending instead of crashing —
 * so the rest of the app keeps working even before email is configured.
 */
async function sendEmail({ to, subject, html, text }) {
  const { BREVO_API_KEY, EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS } = process.env;

  if (!BREVO_API_KEY || !EMAIL_FROM_ADDRESS) {
    console.warn(
      `⚠️  Email not sent (Brevo not configured): "${subject}" to ${to}. ` +
      `Set BREVO_API_KEY/EMAIL_FROM_NAME/EMAIL_FROM_ADDRESS to enable real emails.`
    );
    return { skipped: true };
  }

  // Fail fast instead of hanging if the network call takes too long.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: EMAIL_FROM_NAME || "Elma's Fashion", email: EMAIL_FROM_ADDRESS },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API error (${res.status}): ${body}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendEmail };
