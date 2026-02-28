// /api/bridge.js
export default async function handler(req, res) {
  console.log("Handler called");

  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { topicA, topicB } = req.body;
  console.log("Received topics:", topicA, topicB);

  if (!topicA || !topicB) {
    console.log("Missing topic(s)");
    return res.status(400).json({ error: "Both topics are required." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("No OPENAI_API_KEY found — using fallback");
    return res.status(200).json(generateFallback(topicA, topicB));
  }

  console.log("OpenAI API key found, attempting API call...");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // GPT-3.5
        messages: [
          { role: "system", content: "You are an assistant creating a 10-step bridge connecting two topics." },
          { role: "user", content: `Connect "${topicA}" to "${topicB}" in 10 steps as a JSON array with {step, entity, description, connection_type}` }
        ],
        temperature: 0.8
      })
    });

    console.log("Raw response status:", response.status);
    const data = await response.json();
    console.log("OpenAI raw response:", data);

    // Attempt to parse AI output if it's in text
    let bridge;
    try {
      // The model might return text, so try to parse JSON from the first message content
      const text = data.choices?.[0]?.message?.content || "";
      bridge = JSON.parse(text);
      console.log("Parsed JSON bridge:", bridge);
    } catch (err) {
      console.error("Failed to parse JSON from OpenAI response, using fallback:", err);
      bridge = generateFallback(topicA, topicB);
    }

    return res.status(200).json(bridge);

  } catch (err) {
    console.error("OpenAI API call failed:", err);
    return res.status(200).json(generateFallback(topicA, topicB));
  }
}

// Dynamic fallback generator
function generateFallback(a, b) {
  console.log("Generating dynamic fallback bridge");
  const bridge = [];
  bridge.push({ step: 1, entity: a, description: `Start with ${a}`, connection_type: "start" });
  for (let i = 2; i <= 9; i++) {
    bridge.push({
      step: i,
      entity: `Entity ${i - 1}`,
      description: `Connects step ${i - 1} to step ${i}`,
      connection_type: "link"
    });
  }
  bridge.push({ step: 10, entity: b, description: `End with ${b}`, connection_type: "end" });
  console.log("Fallback bridge generated:", bridge);
  return bridge;
}