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
            content: `Connect "${topicA}" to "${topicB}" in exactly 10 steps. 
            1. Each step must use a **specific, real, verifiable person, place, object, or event**. Do not use general or abstract concepts (e.g., science, technology, history) or vague groups (e.g., developers, musicians). 
            2. Avoid any "name-based shortcuts" or pun connections (e.g., Apple (fruit) → Apple Inc.) — connections must be logically or historically meaningful. 
            3. Each step must **progress linearly toward the final topic**, with no loops, backtracking, or steps that do not advance the bridge. 
            4. Clearly describe **how each step connects to the previous step**, emphasizing real-world causal, historical, or contextual relationships. 
            5. Return **strict, valid JSON only** (no markdown, no code fences).
              - Use **double quotes** for all keys and string values.
              - Do **not** use single quotes.
              - Do **not** include any Markdown, code fences, or backticks.
              - No extra text outside the JSON array.            
            Each object should have: 
              - step (number), 
              - entity (string), 
              - description (string), 
              - connection_type (start, link, end). 
            6. Step 1 must be "${topicA}" (start), and step 10 must be "${topicB}" (end). 
            7. Avoid generic filler entities — each step must be **meaningful and precise**.`
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

      // Remove any Markdown/code fences or leading/trailing backticks
      rawOutput = rawOutput
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .replace(/^`+/i, "")
        .replace(/`+$/i, "")
        .trim();

      // Now parse directly (no replacing quotes)
      bridge = JSON.parse(rawOutput);
      //bridge = JSON.parse(data.choices[0].message.content);
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