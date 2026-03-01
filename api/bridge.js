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
          {
            role: "user",
            content: `
Connect "${topicA}" to "${topicB}" in exactly ${stepCount} numbered steps.

Rules:
- **THINK BEFORE YOU WRITE**: Plan the entire bridge before writing. Don't start writing until you have a clear path from start to finish.
- Each step must be a real, specific person, place, object, or event.
- No professions, abstract concepts, or indescriptive groups as entities.
- Each step must logically connect to the previous step.
- Descriptions should be ${descriptionStyle}
- Step 1 must be "${topicA}"
- "${topicB}" should only appear in the final step
- Never repeat entities across steps
- Step ${stepCount} must be "${topicB}"
- Make sure transitions are clear and logical, avoid extreme jumps when possible.
- Explain how the previous step connects to the current step in the description.

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
    const rawText = data?.choices?.[0]?.message?.content?.trim() || "";

    // 2️⃣ Parse steps
    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
    const steps = [];
    let currentStep = null;

    for (let line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)/);
      if (match) {
        if (currentStep) steps.push(currentStep); // push previous step
        currentStep = {
          entity: match[2].split("–")[0].trim(),
          description: match[2].split("–").slice(1).join("–").trim(),
          image: null
        };
      } else if (currentStep) {
        // Append extra lines to description
        currentStep.description += " " + line;
      }
    }

    // Push last step
    if (currentStep) steps.push(currentStep);

    // 3️⃣ Fetch images for each step
    await Promise.all(
      steps.map(async step => {
        const entityName = step.entity.split("–")[0].split(":")[0].trim();
        step.image = await fetchWikimediaImage(entityName);
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

  try {
    // 1️⃣ Search for pages matching entity
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&format=json&origin=*&srsearch=${query}&srlimit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const firstPage = searchData?.query?.search?.[0];
    if (!firstPage) return null;

    const pageTitle = encodeURIComponent(firstPage.title);

    // 2️⃣ Get images for that page
    const imagesUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=${pageTitle}&prop=images`;
    const imagesRes = await fetch(imagesUrl);
    const imagesData = await imagesRes.json();

    const pages = imagesData.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const images = page.images;
    if (!images || !images.length) return null;

    // 3️⃣ Get URL of first image
    const imageTitle = encodeURIComponent(images[0].title);
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=${imageTitle}&prop=imageinfo&iiprop=url`;
    const imageInfoRes = await fetch(imageInfoUrl);
    const imageInfoData = await imageInfoRes.json();

    const imagePage = Object.values(imageInfoData.query?.pages || {})[0];
    return imagePage?.imageinfo?.[0]?.url || null;

  } catch (err) {
    console.error(`Wikimedia image fetch error for "${entity}":`, err);
    return null;
  }
}