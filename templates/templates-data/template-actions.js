// 🔍 확대/축소/초기화 기능
let currentScale = 1;

function applyScale() {
  const scaleContainer = document.querySelector(".scale-container");
  if (!scaleContainer) return;

  if (document.body.classList.contains("edit-mode")) {
    scaleContainer.style.transform = "none";
  } else {
    scaleContainer.style.transform = `scale(${currentScale})`;
    scaleContainer.style.transformOrigin = "top center";
  }
}

function zoomIn() {
  currentScale += 0.1;
  applyScale();
}

function zoomOut() {
  currentScale = Math.max(0.1, currentScale - 0.1);
  applyScale();
}

function resetZoom() {
  currentScale = 1;
  applyScale();
}

// ✅ window 바인딩 (onclick 대응)
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;

// ✅ 진입 시 view-mode 적용 및 초기 축소
window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("view-mode");
  currentScale = 0.416;   // ✅ 초기 스케일 강제 적용
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

// 💾 저장/삭제 기능 연결
import { handleSaveTemplate, handleDeleteTemplate } from "/muscat/save-templates/save-template-server.js";

document.getElementById("saveTemplateBtn")?.addEventListener("click", handleSaveTemplate);
document.getElementById("deleteTemplateBtn")?.addEventListener("click", handleDeleteTemplate);
