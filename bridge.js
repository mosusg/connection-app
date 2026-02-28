export default async function handler(req, res) {
  const { topicA, topicB } = req.body;

  try {
    // Call Gemini API
    const response = await fetch("https://gemini.googleapis.com/v1/models/gemini-2.5-flash:generateText", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Create a 10-step bridge connecting "${topicA}" to "${topicB}". Return JSON array with objects: {step, entity, description, connection_type}`,
        max_output_tokens: 500
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to generate bridge." });
  }
}