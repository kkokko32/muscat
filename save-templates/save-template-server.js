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

// ✅ URL 토큰 제거
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

const params = new URLSearchParams(window.location.search);
const currentDocId = params.get("docId");
let savedDocId = null;

// ✅ 템플릿 로드
async function loadTemplate() {
  if (!currentDocId) return;
  try {
    const ref = doc(db, "savedTemplates", currentDocId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const response = await fetch(data.htmlUrl);
    const htmlText = await response.text();

    const wrapper = document.getElementById("templateFrame");
    const tempDom = document.createElement("div");
    tempDom.innerHTML = htmlText;
    const newFrame = tempDom.querySelector(".template-frame");

    if (newFrame && wrapper) {
      wrapper.innerHTML = newFrame.innerHTML;
      wrapper.setAttribute("style", newFrame.getAttribute("style") || "");
      wrapper.className = newFrame.className;
    }
  } catch (e) {
    console.error("템플릿 로드 실패:", e);
  }
}

function waitForImageLoad(image) {
  return new Promise(resolve => {
    if (!image || !image.src) return resolve();
    if (image.complete && image.naturalHeight !== 0) return resolve();
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

async function uploadImageToStorage(base64Data, path) {
  try {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64Data, 'data_url');
    const url = await getDownloadURL(storageRef);
    return stripToken(url);
  } catch (e) {
    console.warn("이미지 업로드 실패:", e);
    return null;
  }
}

async function uploadHTMLToStorage(htmlString, path) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);
  console.log("저장된 원본 URL:", url); 
  return stripToken(url);
}

function isDataUrl(url) {
  return url.startsWith("data:");
}

// ✅ 저장 기능
async function handleSaveTemplate() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");

  // 상세페이지에서만 저장 가능
  if (!window.location.pathname.includes("template-")) {
    alert("상세 템플릿 페이지에서만 저장이 가능합니다.");
    return;
  }

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
    const logoExt = getImageExtension(logoImg?.src || "");
    const imageExt = getImageExtension(imageImg?.src || "");

    const logoUrl = logoImg?.src && isDataUrl(logoImg.src)
      ? await uploadImageToStorage(logoImg.src, `${basePath}_logo.${logoExt}`)
      : stripToken(logoImg?.src || "");

    const imageUrl = imageImg?.src && isDataUrl(imageImg.src)
      ? await uploadImageToStorage(imageImg.src, `${basePath}_main.${imageExt}`)
      : stripToken(imageImg?.src || "");

    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, `${basePath}_thumbnail.jpg`);
    if (!thumbnailUrl) throw new Error("썸네일 업로드 실패");

    const htmlPath = basePath.replace("images", "htmls") + ".html";
    const htmlUrl = await uploadHTMLToStorage(frameHTML, htmlPath);
    console.log("✅ htmlUrl 저장 주소:", htmlUrl);
    if (!htmlUrl) {
      alert("디자인 저장 실패: template.html 업로드가 실패했습니다.");
      return;
    }

    // ✅ templateId 보정
    let templateId = "template-001";
    const match = window.location.pathname.match(/template-\d+\.html/);
    if (match) {
      templateId = match[0].replace(".html", "");
    }

    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      logoUrl,
      imageUrl,
      thumbnailUrl,
      htmlUrl,
      templateId,
      createdAt: serverTimestamp()
    });

    savedDocId = docRef.id;
    alert("템플릿이 서버에 저장되었습니다!");

    window.location.href = `${window.location.pathname}?docId=${docRef.id}`;
  } catch (e) {
    console.error("저장 실패:", e.message || e);
    alert("저장 중 오류가 발생했습니다.\n" + (e.message || e));
  } finally {
    hideLoading();
  }
}

async function handleDeleteTemplate() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");
  if (!currentDocId) return alert("삭제할 템플릿이 없습니다.");
  const confirmDelete = confirm("정말 삭제하시겠습니까?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "savedTemplates", currentDocId));
    alert("템플릿이 삭제되었습니다.");
  } catch (e) {
    console.error("삭제 실패:", e.message || e);
    alert("삭제 중 오류가 발생했습니다.\n" + (e.message || e));
  }
}

function setupDownload() {
  downloadBtn?.addEventListener("click", async () => {
    const frame = document.querySelector(".template-frame");
    const logo = frame.querySelector(".logo-preview");
    const image = frame.querySelector(".main-preview");

    await Promise.all([waitForImageLoad(logo), waitForImageLoad(image)]);
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

auth.onAuthStateChanged(user => {
  if (user) {
    setupDownload();
    loadTemplate();
  }
});

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
