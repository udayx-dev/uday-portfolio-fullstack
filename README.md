# 🚀 Uday Shinde — Portfolio (Frontend + Backend)

> A premium glassmorphism portfolio, now with a real backend: a working
> contact form, an AI-powered portfolio chatbot, a private admin dashboard,
> and real blog article pages — all sitting on top of the original static
> site's design, unchanged.

---

## 📁 Project Structure

```
uday-portfolio/
├── index.html, css/, js/, assets/     ← the original static site (design untouched)
├── manifest.json, sw.js               ← PWA (untouched)
├── robots.txt, sitemap.xml            ← SEO (updated)
├── blog/
│   └── interntrack-crm/index.html     ← real blog article page (see note below)
├── admin/
│   ├── login.html                     ← admin login
│   └── index.html                     ← private message/call-request dashboard
└── server/                             ← NEW: the backend
    ├── server.js                       ← Express app (serves the static site + the API)
    ├── db.js                           ← Postgres connection + schema bootstrap
    ├── migrations/init.sql             ← database schema
    ├── routes/                         ← contact, chatbot, admin, analytics endpoints
    ├── services/                       ← email (Resend), ai (Claude), scheduling, analytics
    ├── middleware/                     ← auth, rate limiting, validation
    ├── knowledge/portfolio-knowledge.js ← the ONLY facts the chatbot may use about Uday
    ├── .env.example                    ← copy to .env and fill in
    └── package.json
```

**One process serves everything.** In development and in the simplest
production setup, `server.js` serves the static frontend files *and* the
`/api/*` backend from the same Express app. That means no CORS
configuration is needed for the common case, and only one thing to deploy.

---

## 🧠 A note on the blog article

Part 7 of the brief asked for **one** article titled *"Building InternTrack:
Lessons from Shipping a Full CRM in 2 Weeks, and How I Used Google Dorking
to Find Exposed Admin Panels (Ethically)."* Your site already had **two**
separate blog cards (InternTrack, and Google Dorking). Rather than
inventing a second, thinner article to match the second card, I wrote the
one requested article — covering both topics — and pointed both existing
cards at it (the second card deep-links to the Google Dorking section via
`#google-dorking`). If you'd rather have two fully separate articles later,
duplicate the `blog/interntrack-crm/` folder and split the content — the
routing pattern (`/blog/<slug>/index.html`) already supports it.

---

## ⚡ Local Development

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Set up PostgreSQL
Pick one:
- **Local Postgres**: install it, then `createdb uday_portfolio`.
- **Hosted (recommended for easy setup)**: Neon (neon.tech) or Supabase
  (supabase.com) both have a free tier — create a project, copy the
  connection string they give you.

### 3. Configure environment variables
```bash
cd server
cp .env.example .env
```
Fill in `server/.env`:
- `DATABASE_URL` — your Postgres connection string (set `DATABASE_SSL=true`
  if using Neon/Supabase/most hosted providers).
- `ADMIN_USERNAME` — whatever you want to log in with.
- `ADMIN_PASSWORD_HASH` — generate with:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"
  ```
- `ADMIN_JWT_SECRET` — generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- Leave `RESEND_API_KEY` and `AI_API_KEY` **blank** for now — the app runs
  fine without them (see "Degraded mode" below). Fill them in once you have
  accounts (instructions below).

### 4. Create the database tables
```bash
npm run migrate
```
This also runs automatically every time the server starts, so this step is
optional but useful to confirm your `DATABASE_URL` is correct.

### 5. Run it
```bash
npm start
```
Visit `http://localhost:3000`. The console prints which pieces are
configured:
```
🚀 Portfolio server running at http://localhost:3000
   Database:  configured
   Email:     NOT CONFIGURED (dry-run mode)
   AI:        NOT CONFIGURED (fallback replies only)
   Admin:     configured
```

### Degraded mode (by design)
- **No `DATABASE_URL`**: the static site and the chatbot's contact-flow
  detection still work, but nothing that writes to the database (contact
  form, chatbot contact/call requests, admin dashboard) will function —
  visitors get a clear, friendly error instead of a fake success.
- **No `RESEND_API_KEY`**: form/chatbot submissions are still saved to the
  database (so nothing is lost), but the email step is skipped and logged
  server-side as a "dry run" instead of failing the whole request.
- **No `AI_API_KEY`**: the chatbot still handles contact/call-scheduling
  flows (those don't need AI), but general Q&A falls back to a short,
  honest message pointing the visitor to your email/LinkedIn instead of
  guessing.

---

## 📧 Setting Up Resend (Email Notifications)

1. Create a free account at resend.com.
2. Verify a sending domain (Resend's dashboard walks you through adding a
   couple of DNS records) — or use their sandbox `onboarding@resend.dev`
   sender while testing (it can only send to your own verified email while
   unverified).
3. Create an API key in the Resend dashboard.
4. In `server/.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=Portfolio Contact <contact@yourdomain.com>
   CONTACT_RECEIVER_EMAIL=shinde.uday538@gmail.com
   ```
5. Restart the server. Submit the contact form — you should get a real
   email within a few seconds.

---

## 🤖 Setting Up the AI Chatbot (Anthropic / Claude)

**Why Claude Haiku:** it's inexpensive and fast, which fits a low-traffic
personal-portfolio chatbot well, and the Anthropic Messages API takes a
plain `system` prompt string — perfect for hard-pinning the assistant to
`server/knowledge/portfolio-knowledge.js` without needing a vector database
or RAG pipeline for a knowledge base this small.

1. Create an account at console.anthropic.com.
2. Create an API key.
3. In `server/.env`:
   ```
   AI_API_KEY=sk-ant-your-key-here
   AI_MODEL=claude-haiku-4-5-20251001
   ```
4. Restart the server and ask the chatbot something like "What projects
   has he built?"

**To swap providers later** (e.g. OpenAI): everything AI-related lives in
`server/services/ai.js` — that's the only file that needs to change.

**Updating what the chatbot knows:** edit
`server/knowledge/portfolio-knowledge.js`. It's a plain text block copied
from your site's own content — the chatbot is instructed to never state
anything that isn't in that file, so keep it in sync with `index.html` as
you add projects/experience.

---

## 🔐 Admin Dashboard

- URL: `http://localhost:3000/admin/` (redirects to `/admin/login.html` if
  not logged in).
- Credentials come from `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` in
  `server/.env` — there is no hardcoded or frontend-only password check;
  every dashboard API call is verified server-side against a signed,
  httpOnly session cookie.
- To change your password later, generate a new hash (see step 3 above)
  and update `ADMIN_PASSWORD_HASH`.
- The dashboard shows contact-form messages, chatbot contact requests, and
  call requests, with mark read/unread, status updates, and delete.
- `robots.txt` disallows `/admin/` and `/api/` so it won't get indexed.

---

## 📊 Analytics

A small built-in table (`analytics_events`) tracks event **counts only** —
`page_view`, `blog_article_view`, `contact_form_submit`, `chatbot_message`,
`chatbot_contact_request`, `call_request`. No IPs, emails, or message
content are ever written to it. View the last-30-days summary on the admin
dashboard, or query it directly:
```sql
SELECT event_name, COUNT(*) FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_name;
```
If you'd rather use a third-party privacy-friendly analytics tool
(Plausible, Umami, Fathom) instead or alongside this, just add their script
tag to `index.html` yourself — `ANALYTICS_ID` in `.env` is a documented
placeholder for that, unused by the backend.

---

## 🧪 Testing Checklist

All of these were verified during development against a local Postgres
instance:

**Contact form**: valid submission — invalid email — missing fields —
message over 3000 chars rejected with a clear error — honeypot field
silently accepted without inserting a row — rate limit (5 / 15 min) returns
429 — request body over 32kb returns 413 — DB down gives a friendly 503
instead of a crash — email not configured means the message is still
saved, with a dry-run log server-side.

**Chatbot**: general question with no `AI_API_KEY` gives an honest fallback
message instead of a guess — unrelated question gets the same safe
fallback (with a real key, it redirects politely per the system prompt) —
multi-turn contact-request flow (name, then email, then message, saved
with `source='chatbot'`, email attempted) — multi-turn call-scheduling flow
(name, email, date, time, timezone, reason, saved to `call_requests`, reply
never claims a confirmed booking) — invalid email mid-flow re-prompts
instead of failing.

**Blog**: listing page loads — both cards link to a real page instead of
`#` — direct URL refresh on `/blog/interntrack-crm/` loads correctly (no
client-side routing to break) — responsive layout inherited from the
site's existing CSS — SEO meta/OG/Twitter tags and JSON-LD present.

**Admin**: unauthenticated request returns 401 — wrong password returns
401 — correct login issues a session cookie and the dashboard loads — mark
read/unread, status change, and delete all work — logout invalidates the
session.

Run your own pass after configuring real Resend/AI credentials — those two
integrations could only be exercised in dry-run/fallback mode here without
live API keys.

---

## 🌐 Deployment

This wasn't tied to a specific host. The simplest path for a single Express
app serving both frontend and API:

### Render or Railway (recommended — always-on Node process)
1. Push this repo to GitHub.
2. Create a new Web Service, root directory `server/`, build command
   `npm install`, start command `npm start`.
3. Add all the variables from `server/.env.example` as environment
   variables in the host's dashboard (never commit `.env`).
4. Provision Postgres (Render/Railway both offer a managed Postgres
   add-on, or point `DATABASE_URL` at Neon/Supabase).
5. Deploy — the same service serves `index.html`, `/blog/`, `/admin/`, and
   `/api/*`.

### Vercel
Vercel's serverless model doesn't run a long-lived Express server the same
way — you'd adapt `server.js`'s routes into individual serverless
functions under `/api`, and serve the static frontend as-is via Vercel's
static hosting. This is more restructuring than a Render/Railway deploy, so
only worth it if you specifically want Vercel.

**Either way:**
- Set `NODE_ENV=production`.
- Set `DATABASE_SSL=true` if your Postgres provider requires it (most
  hosted ones do).
- Point your domain's DNS at the host, then update `EMAIL_FROM` to a
  verified sender on that domain in Resend, and update the canonical/OG
  URLs in `index.html` and `blog/interntrack-crm/index.html` if your final
  domain differs from `udayshinde.dev`.

---

## ⚠️ Limitations & Decisions to Know About

- **Chatbot memory is in-process and in-memory** — it resets on server
  restart and won't share state across multiple server instances. Fine for
  a personal portfolio; swap `server/services/sessionStore.js` for Redis
  if you ever scale to multiple instances.
- **Call scheduling never books a real slot.** Per the brief, it only
  records a request and emails you — `server/services/scheduling.js` is
  written as a thin abstraction specifically so Google Calendar
  integration can be added later without touching the chatbot or routes.
- **Rate limiting is in-memory** (via `express-rate-limit`'s default
  store). On a single server instance this is fine; if you ever run
  multiple instances behind a load balancer, switch to a Redis-backed
  store so limits are shared.
- **The two blog cards point to one merged article** — see the note near
  the top of this file.
- **CGPA discrepancy**: your site shows 8.45 in the About section and 8.25
  in the (now-replaced) chatbot's old hardcoded answer. The new knowledge
  base flags this explicitly and the chatbot will mention the range rather
  than guess a single number — worth fixing at the source (`index.html`)
  whichever is current.
- I couldn't test the Resend and Anthropic integrations against **live**
  credentials (I don't have your API keys) — both are code-complete and
  exercised via their documented fallback/dry-run paths here; test them for
  real once you've added your keys.
