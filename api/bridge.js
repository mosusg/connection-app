// /api/bridge.js

export default async function handler(req, res) {
  console.log("Bridge API called");

  // Method check
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { topicA, topicB } = req.body || {};

  if (!topicA || !topicB) {
    return res.status(400).json({ error: "Both topics are required." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY missing — using fallback");
    return res.status(200).json(generateFallback(topicA, topicB));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You create a clear, logical 10-step bridge between two topics."
          },
          {
            role: "user",
            content: `
Connect "${topicA}" to "${topicB}" in exactly 10 steps.

Rules:
1. Each step must be a specific, real, verifiable person, place, object, or event.
2. No abstract concepts or vague groups.
3. No name-based shortcuts or puns.
4. Each step must logically connect to the previous one.
5. Step 1 must be "${topicA}".
6. Step 10 must be "${topicB}".
7. Format as plain text:
   number. Entity – brief explanation of connection
`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return res.status(200).json(generateFallback(topicA, topicB));
    }

    const data = await response.json();

    const textOutput =
      data?.choices?.[0]?.message?.content?.trim() || "";

    if (!textOutput) {
      console.warn("Empty AI response — using fallback");
      return res.status(200).json(generateFallback(topicA, topicB));
    }

    console.log("Bridge generated successfully");

    return res.status(200).json({ bridge: textOutput });

  } catch (err) {
    console.error("OpenAI request failed:", err);
    return res.status(200).json(generateFallback(topicA, topicB));
  }
}


// Fallback generator (plain text)
function generateFallback(a, b) {
  console.log("Generating fallback bridge");

  let text = `1. ${a} – Starting point\n`;

  for (let i = 2; i <= 9; i++) {
    text += `${i}. Entity ${i - 1} – Logical progression step\n`;
  }

  text += `10. ${b} – Final destination`;

  return { bridge: text };
}