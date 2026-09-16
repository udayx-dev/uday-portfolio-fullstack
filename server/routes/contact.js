const express = require('express');
const db = require('../db');
const email = require('../services/email');
const { validateContactPayload, hashIp } = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimit');
const { logEvent } = require('../services/analytics');

const router = express.Router();

router.post('/', contactLimiter, async (req, res) => {
  try {
    // Honeypot: a real visitor never fills this hidden field in.
    // Respond with a fake success so bots don't learn the field is checked.
    if (req.body.company_website) {
      return res.status(200).json({ ok: true });
    }

    const { valid, errors, data } = validateContactPayload(req.body);
    if (!valid) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors: errors });
    }

    if (!db.isConfigured()) {
      return res.status(503).json({ error: 'The contact system is temporarily unavailable. Please email shinde.uday538@gmail.com directly.' });
    }

    const ipHash = hashIp(req.ip);
    const insertResult = await db.query(
      `INSERT INTO messages (name, email, subject, message, source, ip_hash)
       VALUES ($1, $2, $3, $4, 'contact_form', $5)
       RETURNING id`,
      [data.name, data.email, data.subject, data.message, ipHash]
    );
    const messageId = insertResult.rows[0].id;

    const { subject, html } = email.buildContactEmail({ ...data, source: 'contact_form' });
    const emailResult = await email.sendNotification({ subject, html, replyTo: data.email });

    if (emailResult.sent) {
      await db.query('UPDATE messages SET email_sent = TRUE WHERE id = $1', [messageId]);
    } else if (!emailResult.skipped) {
      // The message is safely in the database even though the email failed —
      // it will still show up in the admin dashboard. Log server-side only.
      console.error(`[contact] Email notification failed for message #${messageId}:`, emailResult.error);
    }

    logEvent('contact_form_submit');
    return res.status(200).json({ ok: true, message: "Message sent! I'll get back to you within 24 hours." });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly, or email shinde.uday538@gmail.com directly.' });
  }
});

module.exports = router;
