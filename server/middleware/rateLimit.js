const rateLimit = require('express-rate-limit');

// Contact form: generous enough for a genuine visitor, tight enough to
// stop a script from hammering the endpoint.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent recently. Please try again in a little while.' },
});

// Chatbot: a real conversation involves many turns, so this is per-minute
// rather than per-15-minutes.
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are sending messages too quickly. Please slow down a little.' },
});

// Admin login: brute-force protection.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

module.exports = { contactLimiter, chatbotLimiter, loginLimiter };
