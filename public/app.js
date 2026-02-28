document.getElementById('generate').onclick = async () => {
  const topicA = document.getElementById('topicA').value.trim();
  const topicB = document.getElementById('topicB').value.trim();
  const resultsDiv = document.getElementById('results');

  if (!topicA || !topicB) {
    alert("Please enter both topics!");
    return;
  }

  resultsDiv.textContent = "Generating...";

  try {
    const res = await fetch('/api/bridge.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicA, topicB })
    });

    const data = await res.json();
    resultsDiv.textContent = JSON.stringify(data, null, 2);

  } catch (err) {
    console.error("Fetch error:", err);
    resultsDiv.textContent = "Error fetching bridge. Showing fallback data.";
    resultsDiv.textContent = JSON.stringify(exampleBridge(topicA, topicB), null, 2);
  }
};

// Fallback JSON if API fails
function exampleBridge(a, b) {
  return [
    { step: 1, entity: a, description: `Start with ${a}`, connection_type: "start" },
    { step: 2, entity: "Example Entity 1", description: "Connects to step 1", connection_type: "link" },
    { step: 3, entity: "Example Entity 2", description: "Connects step 2 to next", connection_type: "link" },
    { step: 4, entity: b, description: `End with ${b}`, connection_type: "end" }
  ];
}