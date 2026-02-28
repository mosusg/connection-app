document.getElementById('generate').onclick = async () => {
  const topicA = document.getElementById('topicA').value;
  const topicB = document.getElementById('topicB').value;

  const res = await fetch('/api/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicA, topicB })
  });

  const data = await res.json();
  document.getElementById('results').innerText = JSON.stringify(data, null, 2);
};