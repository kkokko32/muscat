import { db, auth } from "/muscat/common/firebase-init.js";
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

  const brand = document.querySelector(".brand-name")?.innerText || "";
  const slogan = document.querySelector(".brand-slogan")?.innerText || "";
  const logoImg = document.querySelector(".logo-preview");
  const imageImg = document.querySelector(".main-preview");
  const logo = logoImg?.src || "";
  const image = imageImg?.src || "";
  const frame = document.querySelector(".template-frame");
  const frameHTML = frame?.outerHTML || "";

  if (!frame) {
    alert("템플릿이 존재하지 않습니다.");
    return;
  }

  try {
    await Promise.all([
      waitForImageLoad(logoImg),
      waitForImageLoad(imageImg)
    ]);

    const canvas = await html2canvas(frame, {
      backgroundColor: null,
      useCORS: true
    });

    // ✅ 썸네일 리사이징
    const resizedCanvas = document.createElement("canvas");
    const ctx = resizedCanvas.getContext("2d");
    const maxWidth = 400;
    const scaleRatio = maxWidth / canvas.width;
    resizedCanvas.width = maxWidth;
    resizedCanvas.height = canvas.height * scaleRatio;
    ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    const thumbnail = resizedCanvas.toDataURL("image/png");

    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      logo,
      image,
      html: frameHTML,
      thumbnail,
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
