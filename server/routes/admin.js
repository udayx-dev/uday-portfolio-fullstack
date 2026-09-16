const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin, issueSessionCookie, clearSessionCookie } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const { clean } = require('../middleware/validate');

const router = express.Router();

// ---- Auth -------------------------------------------------------------

router.post('/login', loginLimiter, async (req, res) => {
  const username = clean(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUser || !expectedHash) {
    console.error('[admin] ADMIN_USERNAME / ADMIN_PASSWORD_HASH not configured.');
    return res.status(503).json({ error: 'Admin login is not configured on the server.' });
  }

  // Constant-time-ish: always run bcrypt.compare even on username mismatch,
  // so failed logins take a similar amount of time either way.
  const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Wm.HpiyBP7xMWc8f8XI0y9K4XKY6O';
  const isMatch = await bcrypt.compare(password, expectedHash || dummyHash);
  const usernameMatch = username && expectedUser && username === expectedUser;

  if (!usernameMatch || !isMatch) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  issueSessionCookie(res, username);
  return res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  return res.json({ ok: true, username: req.admin.sub });
});

// ---- Messages (contact form + chatbot contact requests) ---------------

router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const { source, status } = req.query;
    const conditions = [];
    const params = [];

    if (source && ['contact_form', 'chatbot'].includes(source)) {
      params.push(source);
      conditions.push(`source = $${params.length}`);
    }
    if (status && ['new', 'in_progress', 'closed'].includes(status)) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT id, name, email, subject, message, source, status, is_read, email_sent, created_at
       FROM messages ${where}
       ORDER BY created_at DESC
       LIMIT 200`,
      params
    );
    return res.json({ ok: true, messages: result.rows });
  } catch (err) {
    console.error('[admin] Failed to list messages:', err.message);
    return res.status(500).json({ error: 'Could not load messages.' });
  }
});

router.patch('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });

    const fields = [];
    const params = [];

    if (typeof req.body.is_read === 'boolean') {
      params.push(req.body.is_read);
      fields.push(`is_read = $${params.length}`);
    }
    if (['new', 'in_progress', 'closed'].includes(req.body.status)) {
      params.push(req.body.status);
      fields.push(`status = $${params.length}`);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

    params.push(id);
    const result = await db.query(`UPDATE messages SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Message not found.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[admin] Failed to update message:', err.message);
    return res.status(500).json({ error: 'Could not update message.' });
  }
});

router.delete('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });
    await db.query('DELETE FROM messages WHERE id = $1', [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[admin] Failed to delete message:', err.message);
    return res.status(500).json({ error: 'Could not delete message.' });
  }
});

// ---- Call requests ------------------------------------------------------

router.get('/calls', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, preferred_date, preferred_time, timezone, reason, status, is_read, email_sent, created_at
       FROM call_requests ORDER BY created_at DESC LIMIT 200`
    );
    return res.json({ ok: true, calls: result.rows });
  } catch (err) {
    console.error('[admin] Failed to list call requests:', err.message);
    return res.status(500).json({ error: 'Could not load call requests.' });
  }
});

router.patch('/calls/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });

    const fields = [];
    const params = [];
    if (typeof req.body.is_read === 'boolean') {
      params.push(req.body.is_read);
      fields.push(`is_read = $${params.length}`);
    }
    if (['pending', 'confirmed', 'declined', 'completed'].includes(req.body.status)) {
      params.push(req.body.status);
      fields.push(`status = $${params.length}`);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

    params.push(id);
    const result = await db.query(`UPDATE call_requests SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Call request not found.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[admin] Failed to update call request:', err.message);
    return res.status(500).json({ error: 'Could not update call request.' });
  }
});

// ---- Dashboard summary --------------------------------------------------

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const [unreadMessages, totalCalls, recentEvents] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM messages WHERE is_read = FALSE"),
      db.query("SELECT COUNT(*)::int AS count FROM call_requests WHERE status = 'pending'"),
      db.query(
        `SELECT event_name, COUNT(*)::int AS count
         FROM analytics_events
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY event_name ORDER BY count DESC`
      ),
    ]);
    return res.json({
      ok: true,
      unreadMessages: unreadMessages.rows[0].count,
      pendingCalls: totalCalls.rows[0].count,
      last30Days: recentEvents.rows,
    });
  } catch (err) {
    console.error('[admin] Failed to load summary:', err.message);
    return res.status(500).json({ error: 'Could not load summary.' });
  }
});

module.exports = router;
