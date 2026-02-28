const topicAInput = document.getElementById("topicA");
const topicBInput = document.getElementById("topicB");
const slider = document.getElementById("depthSlider");
const depthLabel = document.getElementById("depthLabel");
const results = document.getElementById("results");
const button = document.getElementById("generateBtn");

// Map slider value to depth
function getDepthFromSlider(value) {
  if (value == 1) return "light";
  if (value == 2) return "medium";
  if (value == 3) return "in-depth";
}

// Update label when slider moves
slider.addEventListener("input", () => {
  const depth = getDepthFromSlider(slider.value);
  depthLabel.textContent =
    depth === "light"
      ? "Light (6 steps)"
      : depth === "medium"
      ? "Medium (10 steps)"
      : "In-Depth (14 steps)";
});

button.addEventListener("click", async () => {
  const topicA = topicAInput.value.trim();
  const topicB = topicBInput.value.trim();
  const depth = getDepthFromSlider(slider.value);

  if (!topicA || !topicB) {
    results.innerHTML = `<div class="error">Please enter both topics.</div>`;
    return;
  }

  results.innerHTML = "Generating bridge...";

  try {
    const response = await fetch("/api/bridge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topicA,
        topicB,
        depth
      })
    });

    const data = await response.json();

    if (!response.ok) {
      results.innerHTML = `<div class="error">${data.error}</div>`;
      return;
    }

    renderSteps(data.steps);

  } catch (err) {
    results.innerHTML = `<div class="error">Server error.</div>`;
  }
});

function renderSteps(steps) {
  results.innerHTML = "";

  const list = document.createElement("ol");

  steps.forEach(step => {
    const li = document.createElement("li");

    // Remove manual numbering if AI included it
    const cleanStep = step.replace(/^\d+\.\s*/, "");

    li.textContent = cleanStep;
    list.appendChild(li);
  });

  results.appendChild(list);
}