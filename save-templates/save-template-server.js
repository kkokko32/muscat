import { db, auth, storage } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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

async function uploadHTMLToStorage(htmlString, path) {
  try {
    const blob = new Blob([htmlString], { type: "text/html" });
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(snapshot.ref);
    return stripToken(url);
  } catch (e) {
    console.error("❌ uploadHTMLToStorage 실패:", e);
    throw e;
  }
}

async function handleSaveTemplate() {
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

    // ✅ HTML 업로드
    let htmlUrl = "";
    try {
      htmlUrl = await uploadHTMLToStorage(frameHTML, htmlPath);
    } catch (e) {
      hideLoading();
      return alert("디자인 저장 실패: HTML 저장 중 오류 발생");
    }

    if (!htmlUrl) {
      hideLoading();
      return alert("디자인 저장 실패: HTML URL 누락");
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

    const docRef = await addDoc(collection(db, "savedTemplates"), payload);
    savedDocId = docRef.id;

    alert("저장 완료되었습니다!\n내 작업실로 이동할까요?");
    window.location.href = `${window.location.pathname}?docId=${docRef.id}`;
  } catch (e) {
    console.error("❌ 저장 실패:", e);
    alert("저장 중 오류 발생\n" + (e.message || e));
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
    loadTemplate?.();
  }
});

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
