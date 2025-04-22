import { db, auth } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ✅ 저장 함수
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

    // 이미지 로딩 대기
    await Promise.all([
      waitForImageLoad(logo),
      waitForImageLoad(image)
    ]);

    const canvas = await window.html2canvas(frame);  // ✅ window. 사용
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

    alert("✅ 저장 완료!");
  } catch (err) {
    console.error("❌ 저장 중 오류:", err);
    alert("저장 중 문제가 발생했습니다.");
  } finally {
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }
}

// ✅ 이미지 로딩 대기 함수
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

// ✅ 삭제 함수
async function handleDelete() {
  const confirmDelete = confirm("정말 삭제하시겠습니까?");
  if (!confirmDelete) return;

  alert("삭제 기능은 추후 구현 예정입니다.");
  // 추후: Firestore 문서 삭제 + Storage 파일 삭제 로직 여기에 추가
}

// ✅ 다운로드 함수
async function handleDownload() {
  const frame = document.querySelector(".template-frame");
  if (!frame) return;

  const canvas = await window.html2canvas(frame);
  canvas.toBlob(blob => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template.png";
    link.click();
  }, "image/png");
}

// ✅ 버튼 연결 (DOMContentLoaded 이후)
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveTemplateBtn")?.addEventListener("click", handleSave);
  document.getElementById("deleteTemplateBtn")?.addEventListener("click", handleDelete);
  document.getElementById("downloadBtn")?.addEventListener("click", handleDownload);
});
