// ---- GLOBAL CHART FULLSCREEN SYSTEM ---- //

function extractChartConfig(chart) {
  const seen = new WeakSet();

  function sanitize(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const clean = {};
  for (const key in obj) {
    const val = obj[key];

    // ❌ Remove functions (formatters, onclick handlers, scales logic)
    if (typeof val === "function") continue;

    // ❌ Remove DOM or window references
    if (val instanceof HTMLElement || val instanceof CSSStyleSheet) continue;

    // Prevent circular references
    try {
      clean[key] = sanitize(val);
    } catch (_) {}
  }
  return clean;
}


  return {
    type: chart.config.type,
    data: sanitize(chart.data),
    options: sanitize(chart.options || chart.config.options || {})
  };
}

function openChartInIframe(canvasId) {
  const chart = window[canvasId];
  if (!chart) return console.error(`❌ Chart "${canvasId}" not found`);

  const payload = {
    id: canvasId,
    config: extractChartConfig(chart),
  };

  const iframe = document.getElementById("fullscreenIframe");
  const wrapper = document.getElementById("fullscreenIframeWrapper");

  iframe.src = "fullscreen_chart.html";

  iframe.onload = () => iframe.contentWindow.postMessage(payload, "*");

  wrapper.style.display = "block";
}

function attachFullscreenToAllCharts() {
  document.querySelectorAll("canvas").forEach(canvas => {
    const id = canvas.id;
    if (!id) return;

    canvas.style.cursor = "zoom-in";
    canvas.onclick = () => openChartInIframe(id);
  });
}

// ---- Close fullscreen from iframe ---- //
window.addEventListener("message", (event) => {
  if (event.data.action === "closeFullscreen") {
    document.getElementById("fullscreenIframeWrapper").style.display = "none";
  }
});
