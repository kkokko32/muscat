function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) return resolve();
    if (imageElement.complete && imageElement.naturalHeight !== 0) return resolve();
    imageElement.onload = () => resolve();
    imageElement.onerror = () => resolve();
  });
}

const downloadBtn = document.getElementById("downloadBtn");

function setupDownload() {
  downloadBtn?.addEventListener("click", async () => {
    const frame = document.querySelector(".template-frame");
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
    const pdf = new jspdf.jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save("template.pdf");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupDownload();
});
