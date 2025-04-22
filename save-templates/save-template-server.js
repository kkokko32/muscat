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
    console.log("⏳ 저장 시작");

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      console.log("🚫 로그인 사용자 없음");
      return;
    }
    console.log("✅ 로그인 사용자 확인:", user.email);

    const frame = document.querySelector(".template-frame");
    if (!frame) {
      throw new Error("template-frame이 존재하지 않음");
    }

    const logo = frame.querySelector(".logo-preview");
    const image = frame.querySelector(".main-preview");
    const brand = frame.querySelector(".brand-name")?.innerText || "";
    const slogan = frame.querySelector(".brand-slogan")?.innerText || "";
    const templateId = document.body.dataset.templateId || "template-001";

    console.log("📌 브랜드명:", brand);
    console.log("📌 슬로건:", slogan);

    await Promise.all([
      waitForImageLoad(logo),
      waitForImageLoad(image)
    ]);
    console.log("✅ 이미지 로드 완료");

    const canvas = await html2canvas(frame);
    console.log("✅ 썸네일 캔버스 생성 완료");

    const thumbnailBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const htmlContent = frame.outerHTML;
    const htmlBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const timestamp = Date.now();
    const storage = getStorage();

    const thumbRef = ref(storage, `savedTemplates/thumbnails/${timestamp}.png`);
    const htmlRef = ref(storage, `savedTemplates/htmls/${timestamp}.html`);

    console.log("🛰️ Firebase Storage 업로드 시작...");
    await Promise.all([
      uploadBytes(thumbRef, thumbnailBlob),
      uploadBytes(htmlRef, htmlBlob)
    ]);
    console.log("✅ Storage 업로드 완료");

    const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(thumbRef.fullPath)}?alt=media`;
    const htmlUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(htmlRef.fullPath)}?alt=media`;

    console.log("📝 Firestore에 저장 시작...");
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
    console.log("✅ Firestore 저장 완료:", savedDocId);

    alert("저장 완료!");
  } catch (err) {
    console.error("❌ 저장 중 오류 발생:", err);
    alert("저장 중 문제가 발생했습니다.");
  } finally {
    if (document.getElementById("loadingOverlay")) {
      document.getElementById("loadingOverlay").classList.remove("active");
      console.log("🟢 로딩 오버레이 제거됨");
    }
  }
}

saveBtn?.addEventListener("click", handleSave);
