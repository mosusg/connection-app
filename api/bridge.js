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
          { role: "user", content: `Connect "${topicA}" to "${topicB}" in exactly 10 steps.
1. Each step must use a specific, real, verifiable person, place, object, or event. Do not use general or abstract concepts (e.g., science, technology, history) or vague groups (e.g., developers, musicians).
2. Avoid any "name-based shortcuts" or pun connections (e.g., Apple (fruit) → Apple Inc.) — connections must be logically or historically meaningful.
3. Each step must progress linearly toward the final topic, with no loops, backtracking, or steps that do not advance the bridge.
4. Clearly describe how each step connects to the previous step, emphasizing real-world causal, historical, or contextual relationships.
5. Provide each step as: number, entity name, brief description of connection Return plain text.
6. Step 1 must be "${topicA}" (start), and step 10 must be "${topicB}" (end). 
7. Avoid generic filler entities — each step must be meaningful and precise.
8. Avoid generic filler entities — each step must be meaningful and precise.` }
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