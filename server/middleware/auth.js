const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'admin_session';
const SESSION_TTL = '8h';

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_JWT_SECRET is missing or too short. Set a long random value in .env.');
  }
  return secret;
}

function issueSessionCookie(res, username) {
  const token = jwt.sign({ sub: username, role: 'admin' }, getSecret(), { expiresIn: SESSION_TTL });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

// Blocks the request unless a valid admin session cookie is present.
// Never trust a client-supplied header/flag for this — session state only.
function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated.' });
    const payload = jwt.verify(token, getSecret());
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
    req.admin = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { requireAdmin, issueSessionCookie, clearSessionCookie, COOKIE_NAME };
