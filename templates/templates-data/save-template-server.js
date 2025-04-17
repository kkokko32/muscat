// 실배포용 저장 스크립트: Storage 사용 + Firestore에 URL 저장

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
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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

function getImageExtension(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg"; // fallback
}

async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, 'data_url');
  return await getDownloadURL(storageRef);
}

async function handleSaveOrDelete() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (savedDocId) {
    try {
      await deleteDoc(doc(db, "savedTemplates", savedDocId));
      savedDocId = null;
      alert("저장이 해제되었습니다.");
      updateButtonState("저장", false);
    } catch (e) {
      console.error("삭제 실패:", e.message || e);
      alert("삭제 중 오류가 발생했습니다.\n" + (e.message || e));
    }
    return;
  }

  const frame = document.querySelector(".template-frame");
  const frameHTML = frame?.outerHTML || "";
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

    // html2canvas가 정상 로드되었는지 확인
    if (typeof html2canvas !== "function") {
      alert("html2canvas가 로드되지 않았습니다.");
      return;
    }

    // 썸네일 생성
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

    // Storage에 이미지 저장
    const timestamp = Date.now();
    const basePath = `users/${user.uid}/${timestamp}`;

    const logoExt = logoImg?.src ? getImageExtension(logoImg.src) : "jpg";
    const imageExt = imageImg?.src ? getImageExtension(imageImg.src) : "jpg";

    const logoUrl = logoImg?.src ? await uploadImageToStorage(logoImg.src, `${basePath}/logo.${logoExt}`) : "";
    const imageUrl = imageImg?.src ? await uploadImageToStorage(imageImg.src, `${basePath}/main.${imageExt}`) : "";
    const thumbnailUrl = await uploadImageToStorage(thumbnailDataUrl, `${basePath}/thumbnail.jpg`);

    // Firestore 저장
    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      logoUrl,
      imageUrl,
      html: frameHTML,
      thumbnailUrl,
      createdAt: serverTimestamp()
    });

    savedDocId = docRef.id;
    alert("템플릿이 서버에 저장되었습니다!");
    updateButtonState("삭제", true);

  } catch (e) {
    console.error("저장 실패:", e.message || e);
    alert("저장 중 오류가 발생했습니다.\n" + (e.message || e));
  }
}

function updateButtonState(text, isActive) {
  if (!saveBtn) return;
  saveBtn.innerText = text;
  if (isActive) {
    saveBtn.classList.add("active");
  } else {
    saveBtn.classList.remove("active");
  }
}

async function checkExistingSavedTemplate() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "savedTemplates"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const currentBrand = document.querySelector(".brand-name")?.innerText || "";
    if (data.brand === currentBrand) {
      savedDocId = docSnap.id;
      updateButtonState("삭제", true);
    }
  });
}

auth.onAuthStateChanged(user => {
  if (user) {
    checkExistingSavedTemplate();
  }
});

saveBtn?.addEventListener("click", handleSaveOrDelete);