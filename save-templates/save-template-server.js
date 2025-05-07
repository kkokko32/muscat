import { db, auth, storage } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 토큰 제거 함수
function stripToken(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}?alt=media`;
  } catch {
    return url;
  }
}

function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

const saveBtn = document.getElementById("saveTemplateBtn");
const deleteBtn = document.getElementById("deleteTemplateBtn");
const downloadBtn = document.getElementById("downloadBtn");

console.log("✅ saveBtn 존재 여부:", !!saveBtn);  // 버튼 연결 체크

const params = new URLSearchParams(window.location.search);
const currentDocId = params.get("docId");
let savedDocId = null;

async function uploadHTMLToStorage(htmlString, path) {
  console.log("uploadHTMLToStorage 진입:", path);
  console.log("📄 HTML 내용 길이:", htmlString.length);

  try {
    const blob = new Blob([htmlString], { type: "text/html" });
    console.log("🟢 HTML blob size:", blob.size);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(snapshot.ref);
    console.log("📦 저장된 원본 URL:", url);
    return stripToken(url);
  } catch (err) {
    console.error("❌ HTML 저장 실패:", err);
    return null;
  }
}

function waitForImageLoad(img) {
  return new Promise(resolve => {
    if (!img || !img.src) return resolve();
    if (img.complete && img.naturalHeight !== 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

function getImageExtension(url) {
  if (url.startsWith("data:image/png")) return "png";
  if (url.startsWith("data:image/svg")) return "svg";
  if (url.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

function isDataUrl(url) {
  return url.startsWith("data:");
}

async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, "data_url");
  const url = await getDownloadURL(storageRef);
  return stripToken(url);
}

async function handleSaveTemplate() {
  console.log("🧪 handleSaveTemplate 시작됨");

  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");
  showLoading();

  const frame = document.getElementById("templateFrame");
  if (!frame) return alert("템플릿이 존재하지 않습니다.");

  const brand = frame.querySelector(".brand-name")?.innerText || "";
  const slogan = frame.querySelector(".brand-slogan")?.innerText || "";
  const logoImg = frame.querySelector(".logo-preview");
  const imageImg = frame.querySelector(".main-preview");

  try {
    await Promise.all([waitForImageLoad(logoImg), waitForImageLoad(imageImg)]);

    const frameHTML = frame.outerHTML;
    console.log("🧾 frame.outerHTML 길이:", frameHTML.length);

    const canvas = await html2canvas(frame, { backgroundColor: null, useCORS: true });
    const resizedCanvas = document.createElement("canvas");
    const ctx = resizedCanvas.getContext("2d");
    const maxWidth = 400;
    const scaleRatio = maxWidth / canvas.width;
    resizedCanvas.width = maxWidth;
    resizedCanvas.height = canvas.height * scaleRatio;
    ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    const thumbnailDataUrl = resizedCanvas.toDataURL("image/jpeg", 0.4);

    const timestamp = Date.now();
    const basePath = `savedTemplates/images/${user.uid}_${timestamp}`;
    const htmlPath = `savedTemplates/htmls/${user.uid}_${timestamp}.html`;

    const logoExt = getImageExtension(logoImg?.src || "");
    const imageExt = getImageExtension(imageImg?.src || "");

    let logoUrl = "";
    if (logoImg?.src) {
      logoUrl = isDataUrl(logoImg.src)
        ? await uploadImageToStorage(logoImg.src, `${basePath}_logo.${logoExt}`)
        : stripToken(logoImg.src);
    }

    let imageUrl = "";
    if (imageImg?.src) {
      imageUrl = isDataUrl(imageImg.src)
        ? await uploadImageToStorage(imageImg.src, `${basePath}_main.${imageExt}`)
        : stripToken(imageImg.src);
    }

    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, `${basePath}_thumbnail.jpg`);
    const htmlUrl = await uploadHTMLToStorage(frameHTML, htmlPath);

    console.log("✅ 최종 htmlUrl:", htmlUrl);

    if (!htmlUrl) {
      hideLoading();
      alert("디자인 저장 실패: HTML 저장 실패");
      return;
    }

    let templateId = "template-001";
    try {
      const pathname = window.location.pathname;
      const fileName = pathname.substring(pathname.lastIndexOf("/") + 1).split("?")[0];
      const id = fileName.replace(".html", "");
      if (id && id.startsWith("template-")) {
        templateId = id;
      }
    } catch (e) {
      console.warn("templateId 추출 실패:", e);
    }

    const payload = {
      uid: user.uid,
      brand,
      slogan,
      logoUrl,
      imageUrl,
      thumbnailUrl,
      htmlUrl,
      templateId,
      createdAt: serverTimestamp()
    };

    console.log("🔥 Firestore 저장 payload:", payload);

    const docRef = await addDoc(collection(db, "savedTemplates"), payload);
    savedDocId = docRef.id;
    alert("저장 완료되었습니다!\n내 작업실로 이동할까요?");
    window.location.href = `${window.location.pathname}?docId=${docRef.id}`;
  } catch (e) {
    console.error("❌ 저장 중 오류:", e);
    alert("저장 중 오류 발생\n" + (e.message || e));
  } finally {
    hideLoading();
  }
}

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
