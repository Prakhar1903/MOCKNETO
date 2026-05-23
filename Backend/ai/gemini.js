const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";

const normalizeModelName = (model) => {
  if (!model) return DEFAULT_MODEL;
  return String(model)
    .trim()
    .replace(/^models\//i, "");
};

const isFetchAvailable = () => typeof fetch === "function";

const callGeminiText = async ({
  prompt,
  temperature = 0.6,
  maxOutputTokens = 1200,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY not set" };
  }
  if (!isFetchAvailable()) {
    return {
      ok: false,
      error: "Global fetch is not available in this Node.js runtime",
    };
  }

  const model = normalizeModelName(process.env.GEMINI_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Gemini API ${response.status}: ${text || response.statusText}`,
      };
    }

    const data = await response.json();
    const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { ok: true, text: generated };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Request timed out' };
    }
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  callGeminiText,
};
