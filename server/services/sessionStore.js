// Session-level (not permanent) conversation memory for the chatbot.
// Per the spec: "Do not require a database for permanent visitor
// conversation history unless genuinely necessary." A plain in-memory Map
// is enough for a single-instance portfolio backend.
//
// NOTE: this resets on server restart and does not scale across multiple
// server instances/processes. That's an acceptable tradeoff for a personal
// portfolio; if this ever needs to run on multiple instances, swap this
// for Redis without changing the routes that call it.

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const MAX_HISTORY_TURNS = 12; // keep the AI's context window small and cheap
const MAX_SESSIONS = 2000; // basic memory-exhaustion guard

const sessions = new Map();

function touch(sessionId) {
  let session = sessions.get(sessionId);
  if (!session) {
    if (sessions.size >= MAX_SESSIONS) {
      // Drop the oldest session to make room rather than growing unbounded.
      const oldestKey = sessions.keys().next().value;
      sessions.delete(oldestKey);
    }
    session = { history: [], flow: null, lastActive: Date.now() };
    sessions.set(sessionId, session);
  }
  session.lastActive = Date.now();
  return session;
}

function getHistory(sessionId) {
  return touch(sessionId).history;
}

function appendTurn(sessionId, role, content) {
  const session = touch(sessionId);
  session.history.push({ role, content });
  if (session.history.length > MAX_HISTORY_TURNS) {
    session.history.splice(0, session.history.length - MAX_HISTORY_TURNS);
  }
}

function getFlow(sessionId) {
  return touch(sessionId).flow;
}

function setFlow(sessionId, flow) {
  touch(sessionId).flow = flow;
}

function clearFlow(sessionId) {
  touch(sessionId).flow = null;
}

// Periodic cleanup so long-running processes don't leak memory.
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActive > SESSION_TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

module.exports = { getHistory, appendTurn, getFlow, setFlow, clearFlow };
