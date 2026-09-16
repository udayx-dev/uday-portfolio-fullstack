const express = require('express');
const rateLimit = require('express-rate-limit');
const { logEvent, ALLOWED_EVENTS } = require('../services/analytics');

const router = express.Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/event', analyticsLimiter, (req, res) => {
  const { event, meta } = req.body || {};
  if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Unknown event name.' });
  }
  logEvent(event, typeof meta === 'string' ? meta : undefined);
  // Always 204 — analytics should be invisible to the visitor either way.
  return res.status(204).end();
});

module.exports = router;
