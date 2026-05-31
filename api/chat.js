export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ text: "", error: "No API key found" }), { status: 200, headers });
  }

  try {
    const body = await req.json();
    const { messages, system } = body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    const text = await response.text();
    const data = JSON.parse(text);

    if (!response.ok) {
      return new Response(JSON.stringify({ text: "", error: JSON.stringify(data) }), { status: 200, headers });
    }

    const result = data.content?.[0]?.text || "";
    return new Response(JSON.stringify({ text: result }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ text: "", error: err.message }), { status: 200, headers });
  }
}
