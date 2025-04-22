import { db, auth } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import html2canvas from "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

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
    console.log("⏳ 저장 시작");

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      console.log("🚫 로그인 사용자 없음");
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
    const storage = getStorage();

    const thumbRef = ref(storage, `savedTemplates/thumbnails/${timestamp}.png`);
    const htmlRef = ref(storage, `savedTemplates/htmls/${timestamp}.html`);

    await Promise.all([
      uploadBytes(thumbRef, thumbnailBlob),
      uploadBytes(htmlRef, htmlBlob)
    ]);

    const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(thumbRef.fullPath)}?alt=media`;
    const htmlUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(htmlRef.fullPath)}?alt=media`;

    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      templateId,
      thumbnailUrl,
      htmlUrl,
      userEmail: user.email,
      createdAt: serverTimestamp()
    });

    savedDocId = docRef.id;
    alert("저장 완료!");
  } catch (err) {
    console.error("❌ 저장 중 오류 발생:", err);
    alert("저장 중 문제가 발생했습니다.");
  } finally {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.remove("active");
  }
}

async function handleDownload() {
  const frame = document.querySelector(".template-frame");
  if (!frame) return;
  const canvas = await html2canvas(frame);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "template.png";
  link.click();
}

function handleDelete() {
  const confirmDelete = confirm("정말 삭제하시겠습니까?");
  if (!confirmDelete) return;
  alert("❌ 현재 페이지에서 삭제 기능은 미구현 상태입니다.");
}

window.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveTemplateBtn");
  const deleteBtn = document.getElementById("deleteTemplateBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      console.log("✅ 저장 버튼 클릭됨");
      handleSave();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      console.log("🗑️ 삭제 버튼 클릭됨");
      handleDelete();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      console.log("📥 다운로드 버튼 클릭됨");
      handleDownload();
    });
  }
});
