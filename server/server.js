require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const db = require('./db');
const contactRoutes = require('./routes/contact');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const { requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_ROOT = path.join(__dirname, '..'); // the static portfolio lives one level up

app.set('trust proxy', 1); // needed for correct req.ip behind Render/Railway/Vercel proxies

// ---- Security & baseline middleware ------------------------------------

app.use(
  helmet({
    // The portfolio uses inline styles/animations and Google Fonts, so a
    // strict default CSP would break it. This keeps the important
    // protections (no framing, no sniffing) without hand-tuning a full CSP
    // for third-party fonts/CDNs the frontend may add over time.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '32kb' })); // contact/chatbot payloads are small; this blocks oversized bodies

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true, // same-origin deployment by default (see .env.example)
    credentials: true,
  })
);

// ---- API routes ---------------------------------------------------------

app.use('/api/contact', contactRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, database: db.isConfigured() ? 'configured' : 'not configured' });
});

// A tiny protected check the admin static page's JS can call before
// rendering anything sensitive. (requireAdmin already exists for the data
// endpoints in routes/admin.js — this route is just documentation of intent.)
app.get('/api/admin/ping', requireAdmin, (req, res) => res.json({ ok: true }));

// ---- Static site (the existing portfolio, untouched) --------------------

app.use(
  express.static(SITE_ROOT, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      // Keep the service worker + manifest from being aggressively cached
      // so PWA updates roll out promptly; everything else can cache normally.
      if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// ---- Error handling -------------------------------------------------------

// JSON parse errors, oversized bodies, etc. land here — never leak details.
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large.' });
  }
  if (err.status === 400 && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed request.' });
  }
  console.error('[server] Unhandled error:', err);
  return res.status(500).json({ error: 'Something went wrong on our end.' });
});

// 404 fallback for anything under /api that didn't match a route above.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

async function start() {
  try {
    await db.ensureSchema();
  } catch (err) {
    console.error('⚠️  Could not verify/create database schema on startup:', err.message);
    console.error('    The site will still run, but contact/chatbot-contact/admin features will fail until DATABASE_URL is correct.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`   Database:  ${db.isConfigured() ? 'configured' : 'NOT CONFIGURED'}`);
    console.log(`   Email:     ${process.env.RESEND_API_KEY ? 'configured' : 'NOT CONFIGURED (dry-run mode)'}`);
    console.log(`   AI:        ${process.env.AI_API_KEY ? 'configured' : 'NOT CONFIGURED (fallback replies only)'}`);
    console.log(`   Admin:     ${process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH ? 'configured' : 'NOT CONFIGURED'}`);
  });
}

start();

module.exports = app;
