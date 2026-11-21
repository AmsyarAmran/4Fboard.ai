const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});

function allowedOrigin(origin, env) {
  if (!origin) return "https://4fboard.ai";
  const configured = (env.ALLOWED_ORIGINS || "")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (configured.includes(origin)) return origin;
  try {
    const url = new URL(origin);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) return origin;
  } catch {}
  return null;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const permittedOrigin = allowedOrigin(origin, env);
    if (request.method === "OPTIONS") {
      if (!permittedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(permittedOrigin) });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "4Fboard.ai AI Tutor API", configured: Boolean(env.OPENAI_API_KEY) }, 200, permittedOrigin || "https://4fboard.ai");
    }
    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, permittedOrigin || "https://4fboard.ai");
    }
    if (!permittedOrigin) return json({ error: "Origin not allowed" }, 403, "null");
    if (!env.OPENAI_API_KEY) return json({ error: "AI service is not configured yet. Add the OPENAI_API_KEY secret in Cloudflare." }, 503, permittedOrigin);

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 20000) return json({ error: "Request is too large." }, 413, permittedOrigin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON request." }, 400, permittedOrigin); }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const mode = ["topic", "exam", "homework", "followup"].includes(body.mode) ? body.mode : "topic";
    const language = body.language === "ms" ? "Bahasa Melayu" : "English";
    if (!prompt) return json({ error: "Please enter a question or topic." }, 400, permittedOrigin);
    if (prompt.length > 8000) return json({ error: "Please keep each message under 8,000 characters." }, 400, permittedOrigin);

    const instructions = [
      "You are the 4Fboard.ai learning tutor.",
      "Teach clearly and patiently. Adapt to a secondary-school learner.",
      "Use the requested language: " + language + ".",
      "For topic mode, explain the core concept with headings, numbered steps and a simple example.",
      "For exam mode, give key points, definitions, common mistakes and a short revision checklist.",
      "For homework mode, guide the learner step by step and explain the reasoning; do not just give an unexplained final answer.",
      "For follow-up mode, answer the learner's latest question in the context provided.",
      "Use plain text with readable headings and numbered lists. Do not claim to have read files unless their contents are included."
    ].join("\n");

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          instructions,
          input: prompt,
          max_output_tokens: 1200
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return json({ error: data.error?.message || "The AI provider request failed." }, response.status === 429 ? 429 : 502, permittedOrigin);
      }
      let answer = data.output_text || "";
      if (!answer && Array.isArray(data.output)) {
        answer = data.output.flatMap(item => item.content || [])
          .filter(item => item.type === "output_text").map(item => item.text).join("\n");
      }
      if (!answer) return json({ error: "The AI returned an empty response. Please try again." }, 502, permittedOrigin);
      return json({ answer, model: env.OPENAI_MODEL || "gpt-4.1-mini" }, 200, permittedOrigin);
    } catch {
      return json({ error: "Unable to reach the AI service. Please try again." }, 502, permittedOrigin);
    }
  }
};