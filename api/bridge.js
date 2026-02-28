// /api/bridge.js
export default async function handler(req, res) {
  console.log("Handler called");

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { topicA, topicB } = req.body;
  console.log("Received topics:", topicA, topicB);

  if (!topicA || !topicB) {
    return res.status(400).send("Both topics are required.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("No OPENAI_API_KEY found — using fallback");
    return res.status(200).json(generateFallback(topicA, topicB));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an assistant creating a 10-step bridge connecting two topics." },
          { role: "user", content: `Connect "${topicA}" to "${topicB}" in 10 steps as a numbered list of steps, each with entity and description. Return plain text.` }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error:", text);
      return res.status(200).json(generateFallback(topicA, topicB));
    }

    const data = await response.json();
    const textOutput = data.choices?.[0]?.message?.content || "";
    console.log("AI Output:", textOutput);

    // Return text to frontend
    return res.status(200).json({ bridge: textOutput });

  } catch (err) {
    console.error("OpenAI API call failed:", err);
    return res.status(200).json(generateFallback(topicA, topicB));
  }
}

// Fallback: returns plain text bridge
function generateFallback(a, b) {
  console.log("Generating fallback bridge");
  let text = `1. ${a} – Start with ${a}\n`;
  for (let i = 2; i <= 9; i++) {
    text += `${i}. Entity ${i-1} – Connects step ${i-1} to step ${i}\n`;
  }
  text += `10. ${b} – End with ${b}`;
  return { bridge: text };
}