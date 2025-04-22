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

const saveBtn = document.getElementById("saveTemplateBtn");
let savedDocId = null;

function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) {
      resolve();
    } else if (imageElement.complete && imageElement.naturalHeight !== 0) {
      resolve();
    } else {
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
    const logo = frame.querySelector(".logo-preview");
    const image = frame.querySelector(".main-preview");
    const brand = frame.querySelector(".brand-name")?.innerText || "";
    const slogan = frame.querySelector(".brand-slogan")?.innerText || "";
    const templateId = document.body.dataset.templateId || "template-001";

    await Promise.all([
      waitForImageLoad(logo),
      waitForImageLoad(image)
    ]);

    const canvas = await html2canvas(frame);
    const thumbnailBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const timestamp = Date.now();
    const storage = getStorage();

    const thumbRef = ref(storage, `savedTemplates/thumbnails/${timestamp}.png`);
    const htmlRef = ref(storage, `savedTemplates/htmls/${timestamp}.html`);

    const htmlContent = frame.outerHTML;
    const htmlBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });

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
    console.error("❌ 저장 실패:", err);
    alert("저장 중 문제가 발생했습니다.");
  } finally {
    if (document.getElementById("loadingOverlay")) {
      document.getElementById("loadingOverlay").classList.remove("active");
    }
  }
}

saveBtn?.addEventListener("click", handleSave);
