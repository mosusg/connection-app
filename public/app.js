const topicAInput = document.getElementById("topicA");
const topicBInput = document.getElementById("topicB");
const slider = document.getElementById("depthSlider");
const depthLabel = document.getElementById("depthLabel");
const results = document.getElementById("results");
const button = document.getElementById("generateBtn");

const depthMap = {
  1: "minimal",
  2: "concise",
  3: "balanced",
  4: "detailed",
  5: "deep",
  6: "analytical",
  7: "comprehensive"
};

const labelMap = {
  1: "Minimal (Very Short)",
  2: "Concise",
  3: "Balanced",
  4: "Detailed",
  5: "Deep",
  6: "Analytical",
  7: "Comprehensive (Very In-Depth)"
};

slider.addEventListener("input", () => {
  depthLabel.textContent = labelMap[slider.value];
});

button.addEventListener("click", async () => {
  const topicA = topicAInput.value.trim();
  const topicB = topicBInput.value.trim();
  const depth = depthMap[slider.value];

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
    const cleanStep = step.replace(/^\d+\.\s*/, "");
    li.textContent = cleanStep;
    list.appendChild(li);
  });

  results.appendChild(list);
}