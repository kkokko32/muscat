import { db, auth } from "/common/firebase-init.js";
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

// html2canvas 라이브러리 로딩 필요
import html2canvas from "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

const saveBtn = document.getElementById("saveTemplateBtn");
let savedDocId = null;

// ✅ 이미지 로드 확인 함수
function waitForImageLoad(imageElement) {
  return new Promise(resolve => {
    if (!imageElement || !imageElement.src) {
      resolve(); // 이미지 없으면 바로 처리
    } else if (imageElement.complete && imageElement.naturalHeight !== 0) {
      resolve(); // 이미 로드된 상태
    } else {
      imageElement.onload = () => resolve(); // 로드 완료 시 처리
      imageElement.onerror = () => resolve(); // 오류 시에도 강제 완료
    }
  });
}

// 저장 또는 삭제 토글
async function handleSaveOrDelete() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (savedDocId) {
    // ✅ 삭제 처리
    try {
      await deleteDoc(doc(db, "savedTemplates", savedDocId));
      savedDocId = null;
      alert("저장이 해제되었습니다.");
      updateButtonState("저장", false);
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
    return;
  }

  // ✅ 저장 처리
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
    // ✅ 이미지 로딩이 끝날 때까지 대기
    await Promise.all([
      waitForImageLoad(logoImg),
      waitForImageLoad(imageImg)
    ]);

    // ✅ 캡처 실행
    const canvas = await html2canvas(frame, {
      backgroundColor: null,
      useCORS: true
    });

    const thumbnail = canvas.toDataURL("image/png");

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
    console.error("저장 실패:", e);
    alert("저장 중 오류가 발생했습니다.");
  }
}

// 버튼 텍스트 및 스타일 업데이트
function updateButtonState(text, isActive) {
  if (!saveBtn) return;
  saveBtn.innerText = text;
  if (isActive) {
    saveBtn.classList.add("active");
  } else {
    saveBtn.classList.remove("active");
  }
}

// 기존 저장 상태 확인
async function checkExistingSavedTemplate() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "savedTemplates"),
    where("uid", "==", user.uid)
  );
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

// 로그인 완료 후 실행
auth.onAuthStateChanged(user => {
  if (user) {
    checkExistingSavedTemplate();
  }
});

saveBtn?.addEventListener("click", handleSaveOrDelete);
