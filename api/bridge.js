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
    // 1️⃣ Generate bridge text
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
          { role: "system", content: "You create smooth, logical bridges between topics." },
          { role: "user", content: `
Connect "${topicA}" to "${topicB}" in exactly ${stepCount} numbered steps.

Rules:
- Each step must be a real, specific person, place, object, or event.
- No abstract concepts.
- Each step must logically connect to the previous step.
- Descriptions should be ${descriptionStyle}
- Step 1 must be "${topicA}"
- Step ${stepCount} must be "${topicB}"
- Make sure transitions are clear and logical, avoid extreme jumps when possible.

Format:
1. Entity – description
...
${stepCount}. Entity – description
` }
        ]
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to generate bridge." });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    // 2️⃣ Parse steps
    let steps = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line))
      .map((line, i) => {
        const match = line.match(/^\d+\.\s*(.*?)\s*–\s*(.*)$/);
        return match
          ? {
              step: i + 1,
              entity: match[1].trim(),
              description: match[2].trim(),
              connection_type: i === 0 ? "start" : i === stepCount - 1 ? "end" : "link",
              image: null // placeholder
            }
          : null;
      })
      .filter(Boolean);

    if (steps.length !== stepCount) {
      return res.status(500).json({ error: "Invalid bridge format." });
    }

    // 3️⃣ Fetch images for each step
    await Promise.all(
      steps.map(async step => {
        step.image = await fetchWikimediaImage(step.entity);
      })
    );

    return res.status(200).json({ steps });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}

// ------------------ Helpers ------------------ //
async function fetchWikimediaImage(entity) {
  const query = encodeURIComponent(entity);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=${query}&gsrlimit=1&iiprop=url&origin=*`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page.imageinfo?.[0]?.url || null;
  } catch (err) {
    console.error(`Wikimedia image fetch error for "${entity}":`, err);
    return null;
  }
}