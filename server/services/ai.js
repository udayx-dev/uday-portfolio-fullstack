const { PORTFOLIO_KNOWLEDGE } = require('../knowledge/portfolio-knowledge');

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';

const MODEL = process.env.AI_MODEL || 'gemini-3.7-flash';

const SYSTEM_PROMPT = `
You are the portfolio assistant for Uday Shinde's personal website.

RULES:
1. Only state facts about Uday that appear in the KNOWLEDGE BASE below.
2. Never invent education, jobs, companies, skills, dates, achievements, or contact details.
3. If something is not in the knowledge base, say you don't have that information.
4. Keep answers concise, friendly, and professional.
5. Maintain conversation context.
6. Never claim that a call has been booked or confirmed. Call requests are only requests sent to Uday.
7. For unrelated questions, politely redirect the visitor toward Uday's portfolio, projects, skills, experience, or contact options.
8. Keep formatting clean and natural. Do NOT use Markdown bullet points, asterisks (*), hashtags, or excessive headings.
9. Prefer short paragraphs and simple labels such as "Technical Skills:" or "Projects:" when organizing information.
10. Do not use bold or italic Markdown formatting. Write plain, clean text suitable for a modern portfolio chatbot.          

KNOWLEDGE BASE:
${PORTFOLIO_KNOWLEDGE}
`.trim();

function isConfigured() {
  return !!process.env.AI_API_KEY;
}

async function getChatReply(history) {
  if (!isConfigured()) {
    const err = new Error('AI_NOT_CONFIGURED');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const contents = history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT,
        },
      ],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.4,
    },
  };

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `${GEMINI_ENDPOINT}/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.AI_API_KEY,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (response.ok) {
        const data = await response.json();

        const text = data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('')
          .trim();

        if (!text) {
          const err = new Error('AI_EMPTY_RESPONSE');
          err.code = 'AI_EMPTY_RESPONSE';
          throw err;
        }

        return text;
      }

      const bodyText = await response.text().catch(() => '');

      console.error(
        `[ai] Gemini API error (attempt ${attempt}/${maxAttempts}):`,
        response.status,
        bodyText
      );

      // Temporary Google server errors — retry.
      if (
        response.status === 503 ||
        response.status === 500 ||
        response.status === 502
      ) {
        if (attempt < maxAttempts) {
          const delay = attempt * 1500;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      const err = new Error(`AI_PROVIDER_ERROR_${response.status}`);
      err.code = 'AI_PROVIDER_ERROR';
      throw err;
    } catch (error) {
      if (
        error.code === 'AI_PROVIDER_ERROR' ||
        error.code === 'AI_EMPTY_RESPONSE'
      ) {
        throw error;
      }

      console.error('[ai] Gemini request failed:', error.message);

      if (attempt < maxAttempts) {
        const delay = attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const err = new Error('AI_PROVIDER_ERROR');
      err.code = 'AI_PROVIDER_ERROR';
      throw err;
    }
  }

  const err = new Error('AI_PROVIDER_ERROR');
  err.code = 'AI_PROVIDER_ERROR';
  throw err;
}

function fallbackReply() {
  return "I'm having trouble reaching my AI brain right now, so I don't want to guess. The fastest way to get an answer is to email Uday directly at shinde.uday538@gmail.com or use the contact form on this page. 🙏";
}

module.exports = {
  getChatReply,
  fallbackReply,
  isConfigured,
  MODEL,
};