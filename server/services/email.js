// Sends transactional notification emails via Resend's HTTP API.
// https://resend.com/docs/api-reference/emails/send-email
//
// Deliberately uses plain fetch instead of the Resend SDK to keep the
// dependency footprint small — Node 18+ has fetch built in.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.CONTACT_RECEIVER_EMAIL);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildContactEmail({ name, email, subject, message, source }) {
  const label = source === 'chatbot' ? 'NEW PORTFOLIO CONTACT — CHATBOT' : 'NEW PORTFOLIO CONTACT';
  const sourceLabel = source === 'chatbot' ? 'Chatbot' : 'Contact Form';
  const html = `
    <h2>${escapeHtml(label)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    <p><strong>Source:</strong> ${escapeHtml(sourceLabel)}</p>
    <p><strong>Date/time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
  `.trim();
  return { subject: `${label}: ${subject || 'New message'}`, html };
}

function buildCallRequestEmail({ name, email, preferredDate, preferredTime, timezone, reason }) {
  const html = `
    <h2>CALL REQUEST</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Preferred date:</strong> ${escapeHtml(preferredDate || 'Not specified')}</p>
    <p><strong>Preferred time:</strong> ${escapeHtml(preferredTime || 'Not specified')}</p>
    <p><strong>Time zone:</strong> ${escapeHtml(timezone || 'Not specified')}</p>
    <p><strong>Reason:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(reason || 'Not specified')}</p>
    <p><strong>Source:</strong> Chatbot (call scheduling)</p>
    <p><strong>Date/time submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
    <p><em>This is a request, not a confirmed booking. Reply to the visitor directly to confirm a time.</em></p>
  `.trim();
  return { subject: `CALL REQUEST: ${name}`, html };
}

// Returns { sent: boolean, skipped: boolean, error?: string }
// Never throws — callers should always be able to preserve the DB record
// even when email delivery fails or isn't configured.
async function sendNotification({ subject, html, replyTo }) {
  if (!isConfigured()) {
    console.warn('[email] RESEND_API_KEY / EMAIL_FROM / CONTACT_RECEIVER_EMAIL not fully set — skipping real send (dry run).');
    console.info('[email:dry-run]', { subject });
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: process.env.CONTACT_RECEIVER_EMAIL,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.error('[email] Resend API returned an error:', res.status, bodyText);
      return { sent: false, skipped: false, error: `resend_${res.status}` };
    }
    return { sent: true, skipped: false };
  } catch (err) {
    console.error('[email] Failed to reach Resend:', err.message);
    return { sent: false, skipped: false, error: 'network_error' };
  }
}

module.exports = { sendNotification, buildContactEmail, buildCallRequestEmail, isConfigured };
