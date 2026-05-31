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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ text: "", error: "No API key found" }), { status: 200, headers });
  }

  try {
    const body = await req.json();
    const { messages, system } = body;

    // Convert messages to Gemini format
    const geminiMessages = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Prepend system message as first user turn if exists
    const systemInstruction = system ? { parts: [{ text: system }] } : undefined;

    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const text = await response.text();
    const data = JSON.parse(text);

    if (!response.ok) {
      return new Response(JSON.stringify({ text: "", error: JSON.stringify(data) }), { status: 200, headers });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({ text: result }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ text: "", error: err.message }), { status: 200, headers });
  }
}
