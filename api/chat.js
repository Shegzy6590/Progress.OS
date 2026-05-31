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

  const apiKey = process.env.OPENAI_API_KEY;
  
  // Debug: check if key exists
  if (!apiKey) {
    return new Response(JSON.stringify({ text: "", error: "NO_API_KEY - key not found in environment" }), { status: 200, headers });
  }

  try {
    const body = await req.json();
    const { messages, system, max_tokens = 800 } = body;

    const fullMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens,
        messages: fullMessages,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ text: "", error: JSON.stringify(data) }), { status: 200, headers });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ text }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ text: "", error: "CATCH: " + err.message }), { status: 200, headers });
  }
}
