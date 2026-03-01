const topicAInput = document.getElementById("topicA");
const topicBInput = document.getElementById("topicB");
const slider = document.getElementById("depthSlider");
const depthLabel = document.getElementById("depthLabel");
const results = document.getElementById("results");
const button = document.getElementById("generateBtn");

/* ---------------------------
   DEPTH ZONE MAPPING
---------------------------- */
function getDepthFromSlider(value) {
  const v = Number(value);
  if (v < 15) return "minimal";
  if (v < 30) return "concise";
  if (v < 50) return "balanced";
  if (v < 65) return "detailed";
  if (v < 80) return "deep";
  if (v < 92) return "analytical";
  return "comprehensive";
}

function getLabel(depth) {
  switch (depth) {
    case "minimal": return "Minimal";
    case "concise": return "Concise";
    case "balanced": return "Balanced";
    case "detailed": return "Detailed";
    case "deep": return "Deep";
    case "analytical": return "Analytical";
    case "comprehensive": return "Comprehensive";
  }
}

/* ---------------------------
   SMOOTH SLIDER BEHAVIOR
---------------------------- */
function updateSliderVisual() {
  const value = Number(slider.value);
  
  // Gradient stops dynamically
  slider.style.background = `linear-gradient(90deg, #339420 ${value}%, #ddd ${value}%)`;

  const depth = getDepthFromSlider(value);
  depthLabel.textContent = getLabel(depth);
}

// Initialize
updateSliderVisual();
slider.addEventListener("input", updateSliderVisual);

/* ---------------------------
   GENERATE BRIDGE
---------------------------- */
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicA, topicB, depth })
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

/* ---------------------------
   RENDER STEPS CLEANLY WITH IMAGES
---------------------------- */
function renderSteps(steps) {
  results.innerHTML = "";

  const list = document.createElement("ol");

  steps.forEach(step => {
    const li = document.createElement("li");

    // Step container
    const container = document.createElement("div");
    container.className = "step-container";

    // Image (if available)
    if (step.image) {
      const img = document.createElement("img");
      img.src = step.image;
      img.alt = step.entity;
      img.className = "step-image";
      container.appendChild(img);
    }

    // Text
    const text = document.createElement("div");
    text.className = "step-text";
    // Remove numbering from AI output if included
    const cleanStep = step.entity + " – " + step.description;
    text.textContent = cleanStep;

    container.appendChild(text);
    li.appendChild(container);
    list.appendChild(li);
  });

  results.appendChild(list);
}