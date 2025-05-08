// ✅ template-actions.js — 확대/축소/다운로드 전용 (삭제 기능 제거됨)
import html2canvas from "https://cdn.skypack.dev/html2canvas";
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

// 확대 축소 관련 변수
let scale = 1.0;

// 확대
export function zoomIn() {
  scale += 0.1;
  applyZoom();
}

// 축소
export function zoomOut() {
  scale = Math.max(0.1, scale - 0.1);
  applyZoom();
}

// 100% 초기화
export function resetZoom() {
  scale = 1.0;
  applyZoom();
}

// 확대/축소 적용 함수
function applyZoom() {
  const container = document.querySelector(".scale-container");
  if (container) {
    container.style.transform = `scale(${scale})`;
  }
}

// 다운로드 기능
const downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    const frame = document.querySelector(".template-frame");
    if (!frame) return;

    const logo = frame.querySelector(".logo-preview");
    const image = frame.querySelector(".main-preview");

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
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save("template.pdf");
  });
}

// 이미지 로딩 보조 함수
function waitForImageLoad(img) {
  return new Promise(resolve => {
    if (!img || !img.src) return resolve();
    if (img.complete && img.naturalHeight !== 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}
