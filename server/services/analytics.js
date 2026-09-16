// Privacy-conscious, self-hosted analytics.
//
// We deliberately store nothing but an event name, an optional short
// non-identifying label, and a timestamp — no IP addresses, no emails, no
// message content, no cookies/fingerprints. This is enough to answer
// "how is the portfolio being used" without being a tracking system.
//
// If you'd rather use a third-party privacy-friendly analytics provider
// (Plausible, Umami, Fathom), you can leave ANALYTICS_PROVIDER unset to
// keep using this internal table, or point ANALYTICS_PROVIDER at your own
// script tag in index.html — the two are independent and this file's
// events are optional either way.

const db = require('../db');

const ALLOWED_EVENTS = new Set([
  'page_view',
  'blog_article_view',
  'contact_form_submit',
  'chatbot_message',
  'chatbot_contact_request',
  'call_request',
]);

function logEvent(eventName, meta) {
  if (!ALLOWED_EVENTS.has(eventName)) return;
  // Fire-and-forget: analytics must never slow down or break a real request.
  db.query('INSERT INTO analytics_events (event_name, meta) VALUES ($1, $2)', [eventName, meta ? String(meta).slice(0, 160) : null])
    .catch((err) => {
      // Analytics is best-effort; a DB hiccup here should never surface to a visitor.
      if (err.code !== 'DATABASE_NOT_CONFIGURED') console.warn('[analytics] failed to log event:', err.message);
    });
}

module.exports = { logEvent, ALLOWED_EVENTS };
