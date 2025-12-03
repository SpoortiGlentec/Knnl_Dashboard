// ---- Global Fullscreen System ---- //

function openChartInIframe(chartId) {
  const chart = window[chartId];

  if (!chart) {
    console.error("❌ Chart not found:", chartId);
    return;
  }

  const cleanedConfig = extractChartConfig(chart);

  const payload = {
    id: chartId,
    config: cleanedConfig
  };

  const iframe = document.getElementById("fullscreenIframe");
  const wrapper = document.getElementById("fullscreenIframeWrapper");

  iframe.src = "fullscreen_chart.html";

  iframe.onload = () => {
    iframe.contentWindow.postMessage(payload, "*");
  };

  wrapper.style.display = "block";
}


// Close fullscreen (called from inside iframe)
window.closeIframe = function () {
  document.getElementById("fullscreenIframeWrapper").style.display = "none";
  document.getElementById("fullscreenIframe").src = "";
};

// Attach fullscreen mode to a chart canvas
function attachFullscreenToChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  canvas.style.cursor = "zoom-in";
  canvas.onclick = () => openChartInIframe(canvasId);
}

