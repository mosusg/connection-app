export default async function handler(req, res) {
  const { topicA, topicB } = req.body;

  if (!topicA || !topicB) {
    return res.status(400).json({ error: "Both topics are required." });
  }

  // Fallback JSON if API fails
  const fallback = [
    { step: 1, entity: topicA, description: `Start with ${topicA}`, connection_type: "start" },
    { step: 2, entity: "Example Entity 1", description: "Connects to step 1", connection_type: "link" },
    { step: 3, entity: "Example Entity 2", description: "Connects step 2 to next", connection_type: "link" },
    { step: 4, entity: topicB, description: `End with ${topicB}`, connection_type: "end" }
  ];

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json(fallback);
  }

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
          prompt: `Create a 10-step bridge connecting "${topicA}" to "${topicB}". Return JSON array with objects: {step, entity, description, connection_type}`,
          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(200).json(fallback);
  }
}