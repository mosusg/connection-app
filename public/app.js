// app.js
document.getElementById("generateBtn").onclick = async function() {
  const topicA = document.getElementById("topicA").value.trim();
  const topicB = document.getElementById("topicB").value.trim();

  if (!topicA || !topicB) {
    alert("Please enter both topics.");
    return;
  }

  const outputDiv = document.getElementById("output");
  outputDiv.textContent = "Generating bridge...";

  try {
    const response = await fetch("/api/bridge.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicA, topicB })
    });

    const data = await response.json();
    const bridge = data.bridge || [];

    // Clear previous output
    outputDiv.innerHTML = "";

    bridge.forEach(step => {
      const stepEl = document.createElement("div");
      stepEl.className = "bridge-step " + step.connection_type;
      stepEl.innerHTML = `<strong>${step.step}. ${step.entity}</strong> – ${step.description}`;
      outputDiv.appendChild(stepEl);
    });

  } catch (err) {
    console.error("Fetch error:", err);
    outputDiv.textContent = "Failed to generate bridge.";
  }
};