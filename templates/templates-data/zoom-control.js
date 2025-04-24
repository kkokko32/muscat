
let zoomLevel = 0.5;

function applyZoom() {
  const wrapper = document.getElementById("templateZoomWrapper");
  if (wrapper) {
    wrapper.style.transform = `scale(${zoomLevel})`;
  }
}

function zoomIn() {
  zoomLevel = Math.min(2.0, zoomLevel + 0.1);
  applyZoom();
}

function zoomOut() {
  zoomLevel = Math.max(0.1, zoomLevel - 0.1);
  applyZoom();
}

window.addEventListener("DOMContentLoaded", applyZoom);
