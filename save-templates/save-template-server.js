const db = window.db;
const auth = window.auth;
const storage = window.storage;
const html2canvas = window.html2canvas;

let savedDocId = null;

function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) resolve();
    else if (imageElement.complete && imageElement.naturalHeight !== 0) resolve();
    else {
      imageElement.onload = () => resolve();
      imageElement.onerror = () => resolve();
    }
  });
}

async function handleSave() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) loadingOverlay.classList.add("active");

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const frame = document.querySelector(".template-frame");
    if (!frame) throw new Error("template-frame이 존재하지 않음");

    const logo = frame.querySelector(".logo-preview");
    const image = frame.querySelector(".main-preview");
    const brand = frame.querySelector(".brand-name")?.innerText || "";
    const slogan = frame.querySelector(".brand-slogan")?.innerText || "";
    const templateId = document.body.dataset.templateId || "template-001";

    await Promise.all([waitForImageLoad(logo), waitForImageLoad(image)]);

    const canvas = await html2canvas(frame);
    const thumbnailBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const htmlContent = frame.outerHTML;
    const htmlBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const timestamp = Date.now();

    const thumbRef = window.firebaseStorageRef(storage, `savedTemplates/thumbnails/${timestamp}.png`);
    const htmlRef = window.firebaseStorageRef(storage, `savedTemplates/htmls/${timestamp}.html`);

    await Promise.all([
      window.firebaseUploadBytes(thumbRef, thumbnailBlob),
      window.firebaseUploadBytes(htmlRef, htmlBlob)
    ]);

    const thumbnailUrl = await window.firebaseGetDownloadURL(thumbRef);
    const htmlUrl = await window.firebaseGetDownloadURL(htmlRef);

    const docRef = await window.firebaseAddDoc(window.firebaseCollection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      templateId,
      thumbnailUrl,
      htmlUrl,
      userEmail: user.email,
      createdAt: window.firebaseServerTimestamp()
    });

    savedDocId = docRef.id;
    alert("저장 완료!");
  } catch (err) {
    console.error("❌ 저장 오류:", err);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }
}

async function handleDownload() {
  const frame = document.querySelector(".template-frame");
  if (!frame) return;

  const canvas = await html2canvas(frame);
  canvas.toBlob(blob => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template.png";
    link.click();
  }, "image/png");
}

async function handleDelete() {
  alert("❗ 삭제 기능은 추후 구현 예정입니다.");
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveTemplateBtn")?.addEventListener("click", handleSave);
  document.getElementById("deleteTemplateBtn")?.addEventListener("click", handleDelete);
  document.getElementById("downloadBtn")?.addEventListener("click", handleDownload);
});
