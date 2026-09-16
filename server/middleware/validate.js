const validator = require('validator');
const crypto = require('crypto');

const LIMITS = {
  name: 100,
  email: 255,
  subject: 150,
  message: 3000,
  freeText: 300,
};

// Strips control characters and trims. Does not attempt to remove HTML —
// callers must keep this as plain text (we never render it as HTML back to
// a browser without escaping; see services/email.js's escapeHtml for the
// one place it becomes HTML).
function clean(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function validateContactPayload(body) {
  const errors = {};
  const rawName = clean(body.name);
  const rawEmail = clean(body.email);
  const rawSubject = clean(body.subject);
  const rawMessage = clean(body.message);

  const name = rawName.slice(0, LIMITS.name);
  const email = rawEmail.slice(0, LIMITS.email);
  const subject = rawSubject.slice(0, LIMITS.subject);
  const message = rawMessage.slice(0, LIMITS.message);

  if (!name || name.length < 2) errors.name = 'Please enter your name.';
  if (!email || !validator.isEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!rawMessage || rawMessage.length < 10) errors.message = 'Please write a slightly longer message.';
  // Reject outright rather than silently truncating — the visitor should
  // know their full message wasn't accepted, not think it was sent whole.
  if (rawMessage.length > LIMITS.message) errors.message = `Message is too long (max ${LIMITS.message} characters).`;

  return { valid: Object.keys(errors).length === 0, errors, data: { name, email, subject, message } };
}

function validateCallRequestPayload(body) {
  const errors = {};
  const name = clean(body.name).slice(0, LIMITS.name);
  const email = clean(body.email).slice(0, LIMITS.email);
  const preferredDate = clean(body.preferredDate).slice(0, LIMITS.freeText);
  const preferredTime = clean(body.preferredTime).slice(0, LIMITS.freeText);
  const timezone = clean(body.timezone).slice(0, LIMITS.freeText);
  const reason = clean(body.reason).slice(0, LIMITS.message);

  if (!name || name.length < 2) errors.name = 'Please enter your name.';
  if (!email || !validator.isEmail(email)) errors.email = 'Please enter a valid email address.';

  return { valid: Object.keys(errors).length === 0, errors, data: { name, email, preferredDate, preferredTime, timezone, reason } };
}

// One-way hash of the requester's IP for coarse abuse-pattern tracking
// without storing the IP itself in plaintext.
function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.ADMIN_JWT_SECRET || 'salt')).digest('hex');
}

module.exports = { LIMITS, clean, validateContactPayload, validateCallRequestPayload, hashIp };
