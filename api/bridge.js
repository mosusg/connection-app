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

  // Default values
  let stepCount = 10;
  let descriptionStyle = "2 clear sentences.";
  let maxTokens = 450;

  switch (depth) {
    case "minimal":
      stepCount = 4;
      descriptionStyle = "1 short sentence.";
      maxTokens = 250;
      break;

    case "concise":
      stepCount = 6;
      descriptionStyle = "1–2 sentences.";
      maxTokens = 350;
      break;

    case "balanced":
      stepCount = 8;
      descriptionStyle = "2 sentences.";
      maxTokens = 450;
      break;

    case "detailed":
      stepCount = 10;
      descriptionStyle = "3–4 sentences.";
      maxTokens = 600;
      break;

    case "deep":
      stepCount = 12;
      descriptionStyle = "1 well-developed paragraph.";
      maxTokens = 750;
      break;

    case "analytical":
      stepCount = 12;
      descriptionStyle = "1–2 detailed paragraphs.";
      maxTokens = 900;
      break;

    case "comprehensive":
      stepCount = 14;
      descriptionStyle = "2 full, detailed paragraphs.";
      maxTokens = 1200;
      break;
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
            content: "You create smooth, logical bridges between topics."
          },
          {
            role: "user",
            content: `
Connect "${topicA}" to "${topicB}" in exactly ${stepCount} numbered steps.

Rules:
- Each step must be a real, specific person, place, object, or event.
- No abstract concepts.
- Each step must logically connect to the previous step.
- Descriptions should be ${descriptionStyle}
- Step 1 must be "${topicA}"
- Step ${stepCount} must be "${topicB}"

Format:
1. Entity – description
...
${stepCount}. Entity – description
`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to generate bridge." });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    const steps = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line));

    if (steps.length !== stepCount) {
      return res.status(500).json({ error: "Invalid bridge format." });
    }

    return res.status(200).json({ steps });

  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
}