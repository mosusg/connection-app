// /api/bridge.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { topicA, topicB, depth } = req.body || {};

  if (!topicA || !topicB) {
    return res.status(400).json({ error: "Both topics are required." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  // Depth configuration
  let stepCount = 10;
  let descriptionStyle = "2–3 sentences.";
  let maxTokens = 400;

  if (depth === "light") {
    stepCount = 6;
    descriptionStyle = "1 concise sentence.";
    maxTokens = 250;
  }

  if (depth === "medium") {
    stepCount = 10;
    descriptionStyle = "2–3 clear sentences.";
    maxTokens = 450;
  }

  if (depth === "in-depth") {
    stepCount = 14;
    descriptionStyle = "1–2 detailed paragraphs.";
    maxTokens = 900;
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
        temperature: 0.7,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content:
              "You create smooth, logical bridges between two topics."
          },
          {
            role: "user",
            content: `
Connect "${topicA}" to "${topicB}" in exactly ${stepCount} numbered steps.

Rules:
- Each step must be a real, specific person, place, object, or event.
- No abstract concepts.
- No name-based shortcuts or puns.
- Each step must logically and smoothly connect to the previous step.
- Descriptions should be ${descriptionStyle}
- Step 1 must be "${topicA}".
- Step ${stepCount} must be "${topicB}".

Format exactly like:

1. Entity – description
2. Entity – description
...
${stepCount}. Entity – description
`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return res.status(500).json({ error: "Failed to generate bridge." });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.status(500).json({ error: "Empty AI response." });
    }

    // Clean numbered lines
    const steps = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => new RegExp(`^\\d+\\.`).test(line));

    if (steps.length !== stepCount) {
      return res.status(500).json({ error: "Invalid bridge format." });
    }

    return res.status(200).json({ steps });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}