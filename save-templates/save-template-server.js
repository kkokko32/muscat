import { db, auth } from "/muscat/common/firebase-init.js";
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

function stripToken(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}?alt=media`;
  } catch {
    return url;
  }
}

function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) return resolve();
    if (imageElement.complete && imageElement.naturalHeight !== 0) return resolve();
    imageElement.onload = () => resolve();
    imageElement.onerror = () => resolve();
  });
}

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, 'data_url');
  const url = await getDownloadURL(storageRef);
  return stripToken(url);
}

async function uploadHTMLToStorage(htmlString, path) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);
  return stripToken(url);
}

function isDataUrl(url) {
  return url.startsWith("data:");
}

const saveBtn = document.getElementById("saveTemplateBtn");
const deleteBtn = document.getElementById("deleteTemplateBtn");
const params = new URLSearchParams(window.location.search);
const currentDocId = params.get("docId");

async function handleSaveTemplate() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");

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
    const basePath = `users/${user.uid}/${timestamp}`;
    const logoExt = getImageExtension(logoImg?.src || "");
    const imageExt = getImageExtension(imageImg?.src || "");

    const logoUrl = logoImg?.src
      ? (isDataUrl(logoImg.src)
        ? await uploadImageToStorage(logoImg.src, `${basePath}/logo.${logoExt}`)
        : stripToken(logoImg.src))
      : "";

    const imageUrl = imageImg?.src
      ? (isDataUrl(imageImg.src)
        ? await uploadImageToStorage(imageImg.src, `${basePath}/main.${imageExt}`)
        : stripToken(imageImg.src))
      : "";

    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, `${basePath}/thumbnail.jpg`);
    const htmlUrl = await uploadHTMLToStorage(frameHTML, `${basePath}/template.html`);

    let templateId = "template-001";
    try {
      const pathname = window.location.pathname;
      const fileName = pathname.substring(pathname.lastIndexOf("/") + 1).split("?")[0];
      const id = fileName.replace(".html", "");
      if (id && id.startsWith("template-")) {
        templateId = id;
      }
    } catch (e) {
      console.warn("❌ templateId 추출 실패:", e);
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

    alert("템플릿이 서버에 저장되었습니다!");
    window.location.href = `${window.location.pathname}?docId=${docRef.id}`;
  } catch (e) {
    console.error("저장 실패:", e);
    alert("저장 중 오류 발생\n" + (e.message || e));
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
    alert("삭제 중 오류 발생\n" + (e.message || e));
  }
}

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
