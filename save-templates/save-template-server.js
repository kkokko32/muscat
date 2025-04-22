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

console.log("✅ save-template-server.js 연결됨");

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

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

function isDataUrl(url) {
  return url.startsWith("data:");
}

async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, 'data_url');
  return await getDownloadURL(storageRef);
}

async function uploadHTMLToStorage(htmlString, path) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  return await getDownloadURL(snapshot.ref);
}

async function handleSaveTemplate() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  showLoading();

  const frame = document.querySelector(".template-frame");
  if (!frame) {
    alert("템플릿이 존재하지 않습니다.");
    hideLoading();
    return;
  }

  const brand = frame.querySelector(".brand-name")?.innerText || "";
  const slogan = frame.querySelector(".brand-slogan")?.innerText || "";
  const logoImg = frame.querySelector(".logo-preview");
  const imageImg = frame.querySelector(".main-preview");

  try {
    await Promise.all([
      waitForImageLoad(logoImg),
      waitForImageLoad(imageImg)
    ]);

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
    const htmlPath = `savedTemplates/htmls/${timestamp}.html`;
    const imagePath = `savedTemplates/images/${timestamp}.png`;
    const logoPath = `savedTemplates/images/${timestamp}-logo.png`;
    const thumbnailPath = `savedTemplates/images/${timestamp}-thumb.jpg`;

    let logoUrl = "";
    if (logoImg?.src && isDataUrl(logoImg.src)) {
      logoUrl = await uploadImageToStorage(logoImg.src, logoPath);
    }

    let imageUrl = "";
    if (imageImg?.src && isDataUrl(imageImg.src)) {
      imageUrl = await uploadImageToStorage(imageImg.src, imagePath);
    }

    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, thumbnailPath);
    const htmlUrl = await uploadHTMLToStorage(frameHTML, htmlPath);

    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      logoUrl,
      imageUrl,
      thumbnailUrl,
      htmlUrl,
      createdAt: serverTimestamp()
    });

    savedDocId = docRef.id;
    alert("템플릿이 서버에 저장되었습니다!");
  } catch (e) {
    console.error("저장 실패:", e.message || e);
    alert("저장 중 오류가 발생했습니다.\n" + (e.message || e));
  } finally {
    hideLoading();
  }
}

async function handleDeleteTemplate() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (!currentDocId) {
    alert("삭제할 템플릿이 없습니다.");
    return;
  }

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

    await Promise.all([
      waitForImageLoad(logo),
      waitForImageLoad(image)
    ]);

    const canvas = await html2canvas(frame);
    const link = document.createElement("a");
    link.download = "template.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

auth.onAuthStateChanged(user => {
  if (user) {
    setupDownload();
  }
});

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);