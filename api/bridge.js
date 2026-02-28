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
          {
            role: "system",
            content: "You are an assistant creating a 10-step bridge connecting two topics. Each step should be a specific person, place, object, or event."
          },
          {
            role: "user",
            content: `Connect "${topicA}" to "${topicB}" in 10 steps. Each step must use specific, real things, people, places, events, or objects. Under zero circumstances do you use general/abstract concepts (i.e: Science, mathematics, history, etc.) or undescreptive grouping of people (i.e: Game developers or Electricians). Instead, use exact nouns to refer to the subject such as the precise name of the person, object, place, or event. Provide each step as: number, entity name, brief description of connection. Return a JSON array with each object containing: step (number), entity (string), description (string), connection_type (start, link, end). No extra text and without any markdown or code fences`
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error:", text);
      return res.status(200).json(generateFallback(topicA, topicB));
    }

    const data = await response.json();
    let bridge = [];

    try {
      // Strip ```json ... ``` or ``` around AI output
      let rawOutput = data.choices[0].message.content;

      // Remove code fences if present
      rawOutput = rawOutput.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

      bridge = JSON.parse(rawOutput);
      // Try parsing JSON from model output
      bridge = JSON.parse(data.choices[0].message.content);
    } catch (parseErr) {
      console.error("Failed to parse AI output as JSON:", parseErr);
      return res.status(200).json(generateFallback(topicA, topicB));
    }

    console.log("AI bridge generated:", bridge);
    return res.status(200).json({ bridge });

  } catch (err) {
    console.error("OpenAI API call failed:", err);
    return res.status(200).json(generateFallback(topicA, topicB));
  }
}

// Structured fallback JSON
function generateFallback(a, b) {
  console.log("Generating fallback bridge");
  const bridge = [];
  bridge.push({ step: 1, entity: a, description: `Start with ${a}`, connection_type: "start" });
  for (let i = 2; i <= 9; i++) {
    bridge.push({ step: i, entity: `Entity ${i-1}`, description: `Connects step ${i-1} to step ${i}`, connection_type: "link" });
  }
  bridge.push({ step: 10, entity: b, description: `End with ${b}`, connection_type: "end" });
  return { bridge };
}