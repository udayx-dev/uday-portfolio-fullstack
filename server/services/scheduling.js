// Scheduling abstraction layer.
//
// Today this only records a call REQUEST (not a confirmed booking) — see
// Part 6 of the spec: the chatbot must never claim a slot is confirmed.
//
// When Google Calendar integration is added later, this is the only file
// that should need to change: `requestCall()` would additionally check
// real availability and could create a tentative calendar hold. The route
// and chatbot code that call this function don't need to know how
// scheduling is implemented underneath.

const db = require('../db');
const email = require('./email');

async function requestCall({ name, email: visitorEmail, preferredDate, preferredTime, timezone, reason, ipHash }) {
  const result = await db.query(
    `INSERT INTO call_requests (name, email, preferred_date, preferred_time, timezone, reason, ip_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [name, visitorEmail, preferredDate || null, preferredTime || null, timezone || null, reason || null, ipHash || null]
  );

  const { subject, html } = email.buildCallRequestEmail({ name, email: visitorEmail, preferredDate, preferredTime, timezone, reason });
  const emailResult = await email.sendNotification({ subject, html, replyTo: visitorEmail });

  if (emailResult.sent) {
    await db.query('UPDATE call_requests SET email_sent = TRUE WHERE id = $1', [result.rows[0].id]);
  }

  return { id: result.rows[0].id, createdAt: result.rows[0].created_at, emailSent: emailResult.sent };
}

module.exports = { requestCall };
