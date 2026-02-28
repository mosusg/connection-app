export default async function handler(req, res) {
  console.log("Handler called");  // Step 1: function triggered

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found — using fallback");
    return res.status(200).json(generateFallback(topicA, topicB));
  }

  console.log("Gemini API key found, attempting API call...");

  try {
    const response = await fetch(
      "https://gemini.googleapis.com/v1/models/gemini-2.5-flash:generateText",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: `Create a 5-step bridge connecting "${topicA}" to "${topicB}". Return JSON array with objects: {step, entity, description, connection_type}`,
          max_output_tokens: 500
        })
      }
    );

    console.log("Raw response status:", response.status);

    const text = await response.text();
    console.log("Raw response text:", text);

    // Try to parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
      console.log("Parsed JSON:", data);
    } catch (err) {
      console.error("Failed to parse JSON, returning fallback:", err);
      data = generateFallback(topicA, topicB);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Gemini API call failed:", err);
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