import { db, auth, storage } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const saveBtn = document.getElementById("saveTemplateBtn");
const deleteBtn = document.getElementById("deleteTemplateBtn");
let savedDocId = null;

const params = new URLSearchParams(window.location.search);
const currentDocId = params.get("docId");

console.log("✅ save-template-server.js 연결됨");

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

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, 'data_url');
  return await getDownloadURL(storageRef);
}

async function uploadHTMLToStorage(htmlString, path) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  const htmlRef = ref(storage, path);
  await uploadBytes(htmlRef, blob);
  return await getDownloadURL(htmlRef);
}

// ✅ 템플릿 상세페이지에서 사용하는 저장 기능
async function handleSaveTemplate() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  const frame = document.querySelector(".template-frame");
  if (!frame) {
    alert("템플릿이 존재하지 않습니다.");
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

    if (typeof html2canvas !== "function") {
      alert("html2canvas가 로드되지 않았습니다.");
      return;
    }

    const clonedFrame = frame.cloneNode(true);
    clonedFrame.querySelector(".brand-name").innerText = brand;
    clonedFrame.querySelector(".brand-slogan").innerText = slogan;
    clonedFrame.querySelector(".logo-preview").src = logoImg?.src || "";
    clonedFrame.querySelector(".main-preview").src = imageImg?.src || "";
    const frameHTML = clonedFrame.outerHTML;

    const canvas = await html2canvas(frame, {
      backgroundColor: null,
      useCORS: true
    });

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

    const logoUrl = logoImg?.src ? await uploadImageToStorage(logoImg.src, `${basePath}/logo.${logoExt}`) : "";
    const imageUrl = imageImg?.src ? await uploadImageToStorage(imageImg.src, `${basePath}/main.${imageExt}`) : "";
    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, `${basePath}/thumbnail.jpg`);
    const htmlUrl = await uploadHTMLToStorage(frameHTML, `${basePath}/template.html`);

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
  }
}

// ✅ 템플릿 상세페이지에서 사용하는 삭제 기능
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

// ✅ 템플릿 상세페이지에서 사용하는 저장/삭제 버튼 이벤트 바인딩
auth.onAuthStateChanged(user => {
  if (user) {
    // 필요 시 이후 기능 확장 가능
  }
});

saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
