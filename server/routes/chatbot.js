const express = require('express');
const crypto = require('crypto');
const validator = require('validator');
const db = require('../db');
const ai = require('../services/ai');
const email = require('../services/email');
const scheduling = require('../services/scheduling');
const sessionStore = require('../services/sessionStore');
const { clean, hashIp } = require('../middleware/validate');
const { chatbotLimiter } = require('../middleware/rateLimit');
const { logEvent } = require('../services/analytics');

const router = express.Router();

const MAX_MESSAGE_LEN = 800;

const CONTACT_INTENT = /\b(i want to (contact|hire|reach out to|message|get in touch with|connect with)|i'd like to (contact|hire|reach out to|get in touch with|connect with)|i have a project for (him|uday)|(send|drop) (him |uday )?a message|get in touch with (him|uday)|i(?:'m| am) looking for a (developer|freelancer)\b)/i;

const CALL_INTENT = /\b(schedule a call|book a call|have a meeting|hop on a call|jump on a call|discuss.*on a call|talk on a call|set up a call)\b/i;

function newFlow(type) {
  if (type === 'contact') {
    return { type: 'contact', step: 'name', data: {} };
  }
  return { type: 'call', step: 'name', data: {} };
}

// Advances a slot-filling flow by one user reply. Returns the bot's next
// message, and whether the flow is now complete (caller then persists it).
async function advanceFlow(session, sessionId, userText, ipHash) {
  const flow = session.flow;
  const text = clean(userText).slice(0, MAX_MESSAGE_LEN);

  if (flow.type === 'contact') {
    if (flow.step === 'name') {
      if (!text) return { reply: "No worries — what name should I pass along to Uday?" };
      flow.data.name = text.slice(0, 100);
      flow.step = 'email';
      return { reply: `Thanks, ${flow.data.name}! What's the best email for Uday to reply to?` };
    }
    if (flow.step === 'email') {
      if (!validator.isEmail(text)) return { reply: "That doesn't look like a valid email — could you double-check it?" };
      flow.data.email = text;
      flow.step = 'message';
      return { reply: "Got it. What would you like to tell Uday? (e.g. the opportunity, project, or question)" };
    }
    if (flow.step === 'message') {
      if (!text || text.length < 5) return { reply: 'Could you add a little more detail so Uday has context?' };
      flow.data.message = text.slice(0, 2000);

      if (!db.isConfigured()) {
        sessionStore.clearFlow(sessionId);
        return { reply: "I've got your message, but the contact system isn't fully set up on the server yet — please email shinde.uday538@gmail.com directly in the meantime. 🙏", done: true };
      }

      const insertResult = await db.query(
        `INSERT INTO messages (name, email, subject, message, source, ip_hash)
         VALUES ($1, $2, $3, $4, 'chatbot', $5) RETURNING id`,
        [flow.data.name, flow.data.email, 'Chatbot inquiry', flow.data.message, ipHash]
      );
      const { subject, html } = email.buildContactEmail({ ...flow.data, subject: 'Chatbot inquiry', source: 'chatbot' });
      const emailResult = await email.sendNotification({ subject, html, replyTo: flow.data.email });
      if (emailResult.sent) await db.query('UPDATE messages SET email_sent = TRUE WHERE id = $1', [insertResult.rows[0].id]);

      logEvent('chatbot_contact_request');
      sessionStore.clearFlow(sessionId);
      return { reply: `Thanks, ${flow.data.name}! I've passed your message on to Uday — he usually replies within 24 hours. 🎉`, done: true };
    }
  }

  if (flow.type === 'call') {
    if (flow.step === 'name') {
      if (!text) return { reply: 'What name should I put on the call request?' };
      flow.data.name = text.slice(0, 100);
      flow.step = 'email';
      return { reply: "What's your email, so Uday can confirm a time with you?" };
    }
    if (flow.step === 'email') {
      if (!validator.isEmail(text)) return { reply: "That doesn't look like a valid email — could you double-check it?" };
      flow.data.email = text;
      flow.step = 'date';
      return { reply: 'What date works best for you?' };
    }
    if (flow.step === 'date') {
      flow.data.preferredDate = text.slice(0, 100) || 'Not specified';
      flow.step = 'time';
      return { reply: 'And roughly what time?' };
    }
    if (flow.step === 'time') {
      flow.data.preferredTime = text.slice(0, 100) || 'Not specified';
      flow.step = 'timezone';
      return { reply: "What time zone are you in? (e.g. IST, EST, GMT)" };
    }
    if (flow.step === 'timezone') {
      flow.data.timezone = text.slice(0, 60) || 'Not specified';
      flow.step = 'reason';
      return { reply: "Last thing — what would you like to discuss on the call?" };
    }
    if (flow.step === 'reason') {
      flow.data.reason = text.slice(0, 1000) || 'Not specified';

      if (!db.isConfigured()) {
        sessionStore.clearFlow(sessionId);
        return { reply: "I've noted your request, but the scheduling system isn't fully set up on the server yet — please email shinde.uday538@gmail.com directly with your availability. 🙏", done: true };
      }

      await scheduling.requestCall({ ...flow.data, ipHash });
      logEvent('call_request');
      sessionStore.clearFlow(sessionId);
      return {
        reply: `Thanks! I've sent your call request to Uday for ${flow.data.preferredDate} at ${flow.data.preferredTime} (${flow.data.timezone}). He'll review it and get back to you by email to confirm — this isn't a confirmed booking yet. 📅`,
        done: true,
      };
    }
  }

  // Shouldn't be reachable, but fail safe rather than crash.
  sessionStore.clearFlow(sessionId);
  return { reply: "Let's start over — how can I help?", done: true };
}

router.post('/', chatbotLimiter, async (req, res) => {
  try {
    const rawMessage = req.body?.message;
    let sessionId = req.body?.sessionId;
    if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (typeof sessionId !== 'string' || sessionId.length > 100) {
      sessionId = crypto.randomUUID();
    }

    const userText = clean(rawMessage).slice(0, MAX_MESSAGE_LEN);
    const ipHash = hashIp(req.ip);
    logEvent('chatbot_message');

    // 1. Continue an in-progress contact/call flow if one exists.
    const activeFlow = sessionStore.getFlow(sessionId);
    if (activeFlow) {
      const session = { flow: activeFlow };
      const { reply } = await advanceFlow(session, sessionId, userText, ipHash);
      sessionStore.appendTurn(sessionId, 'user', userText);
      sessionStore.appendTurn(sessionId, 'assistant', reply);
      return res.json({ reply, sessionId });
    }

    // 2. Detect a fresh intent to start one of those flows.
    if (CALL_INTENT.test(userText)) {
      sessionStore.setFlow(sessionId, newFlow('call'));
      const reply = "Happy to help set that up! I can't confirm calendar slots yet, but I'll send Uday your request. What's your name?";
      sessionStore.appendTurn(sessionId, 'user', userText);
      sessionStore.appendTurn(sessionId, 'assistant', reply);
      return res.json({ reply, sessionId });
    }
    if (CONTACT_INTENT.test(userText)) {
      sessionStore.setFlow(sessionId, newFlow('contact'));
      const reply = "I'd be glad to pass that along! What's your name?";
      sessionStore.appendTurn(sessionId, 'user', userText);
      sessionStore.appendTurn(sessionId, 'assistant', reply);
      return res.json({ reply, sessionId });
    }

    // 3. Otherwise, answer naturally using the AI provider (grounded in the
    //    portfolio knowledge base), with a safe non-hallucinating fallback.
    sessionStore.appendTurn(sessionId, 'user', userText);
    let reply;
    try {
      reply = await ai.getChatReply(sessionStore.getHistory(sessionId));
    } catch (err) {
      console.error('[chatbot] AI provider failed, using fallback:', err.message);
      reply = ai.fallbackReply();
    }
    sessionStore.appendTurn(sessionId, 'assistant', reply);

    return res.json({ reply, sessionId });
  } catch (err) {
    console.error('[chatbot] Unexpected error:', err);
    return res.status(500).json({ error: "Something went wrong on my end — please try again, or email shinde.uday538@gmail.com directly." });
  }
});

module.exports = router;
