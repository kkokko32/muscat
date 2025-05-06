// 🔍 확대/축소/초기화 기능
let scale = 1;
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetZoomBtn = document.getElementById("resetZoomBtn");
const templateFrame = document.getElementById("templateFrame");

function applyScale() {
  if (templateFrame) {
    templateFrame.style.transform = `scale(${scale})`;
    templateFrame.style.transformOrigin = "top center";
  }
}

zoomInBtn?.addEventListener("click", () => {
  scale += 0.1;
  applyScale();
});

zoomOutBtn?.addEventListener("click", () => {
  scale = Math.max(0.1, scale - 0.1);
  applyScale();
});

resetZoomBtn?.addEventListener("click", () => {
  scale = 1;
  applyScale();
});

// 💾 다운로드 기능
const downloadBtn = document.getElementById("downloadBtn");

function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) return resolve();
    if (imageElement.complete && imageElement.naturalHeight !== 0) return resolve();
    imageElement.onload = () => resolve();
    imageElement.onerror = () => resolve();
  });
}

downloadBtn?.addEventListener("click", async () => {
  const frame = document.querySelector(".template-frame");
  const logo = frame?.querySelector(".logo-preview");
  const image = frame?.querySelector(".main-preview");

  await Promise.all([
    waitForImageLoad(logo),
    waitForImageLoad(image)
  ]);

  const canvas = await html2canvas(frame, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    imageTimeout: 3000,
    scale: 2
  });

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const pdf = new jspdf.jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save("template.pdf");
});

//  저장/삭제 기능 연결
import { handleSaveTemplate, handleDeleteTemplate } from "./save-template-server.js";

document.getElementById("saveTemplateBtn")?.addEventListener("click", handleSaveTemplate);
document.getElementById("deleteTemplateBtn")?.addEventListener("click", handleDeleteTemplate);

// 확대/축소 기능
window.zoomOut = zoomOut;
window.zoomIn = zoomIn;
window.resetZoom = resetZoom;