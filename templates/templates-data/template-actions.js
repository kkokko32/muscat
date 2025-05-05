import { db, storage, auth } from "/muscat/common/firebase-init.js";
import {
  collection, addDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref, uploadString, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let currentScale = 0.416;
let savedDocId = null;
let uploadedPaths = {};

export function zoomIn() {
  currentScale = Math.min(currentScale + 0.1, 2);
  applyScale();
}

export function zoomOut() {
  currentScale = Math.max(currentScale - 0.1, 0.1);
  applyScale();
}

export function resetZoom() {
  currentScale = 1.0;
  applyScale();
}

function applyScale() {
  const frame = document.getElementById("templateFrame");
  if (!frame) return;

  const baseWidth = 2480;
  const baseHeight = 3508;

  frame.style.width = `${baseWidth * currentScale}px`;
  frame.style.height = `${baseHeight * currentScale}px`;
  frame.style.transform = `translateX(-50%) scale(${currentScale})`;
  frame.style.transformOrigin = 'top center';
}

export async function saveTemplate() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.add("active");

  try {
    const frame = document.getElementById("templateFrame");
    const brand = document.getElementById("brandName")?.textContent || "";
    const slogan = document.getElementById("brandDesc")?.textContent || "";
    const logoUrl = document.getElementById("brandLogo")?.src || "";
    const mainUrl = document.getElementById("mainImage")?.src || "";

    const canvas = await html2canvas(frame, { useCORS: true, scale: 1 });
    const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const user = auth.currentUser;
    if (!user) return alert("로그인이 필요합니다.");

    const timestamp = Date.now();
    const thumbnailRef = ref(storage, `savedTemplates/images/${user.uid}_${timestamp}_thumbnail.jpg`);
    await uploadString(thumbnailRef, thumbnailDataUrl, 'data_url');
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    const logoBlob = await fetch(logoUrl).then(r => r.blob());
    const logoRef = ref(storage, `savedTemplates/images/${user.uid}_${timestamp}_logo.jpg`);
    await uploadBytes(logoRef, logoBlob);
    const logoDownloadUrl = await getDownloadURL(logoRef);

    uploadedPaths = {
      thumbnailPath: thumbnailRef.fullPath,
      logoPath: logoRef.fullPath,
    };

    const docRef = await addDoc(collection(db, "savedTemplates"), {
      uid: user.uid,
      brand,
      slogan,
      thumbnailUrl,
      logoUrl: logoDownloadUrl,
      mainUrl,
      createdAt: serverTimestamp(),
    });

    savedDocId = docRef.id;
    sessionStorage.setItem("savedDocId", savedDocId);

    document.getElementById("saveTemplateBtn").disabled = true;
    document.getElementById("deleteTemplateBtn").disabled = false;

    if (confirm("저장 완료되었습니다!\n\n내 작업실로 이동할까요?")) {
      window.location.href = "/muscat/save-templates/my-save.html";
    }

  } catch (err) {
    console.error("저장 오류:", err);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    if (overlay) overlay.classList.remove("active");
  }
}

export async function deleteTemplate() {
  if (!savedDocId) return alert("저장된 템플릿이 없습니다.");
  if (!confirm("정말 삭제하시겠습니까?")) return;

  await deleteDoc(doc(db, "savedTemplates", savedDocId));
  for (const path of Object.values(uploadedPaths)) {
    await deleteObject(ref(storage, path)).catch(() => {});
  }

  savedDocId = null;
  uploadedPaths = {};
  sessionStorage.removeItem("savedDocId");

  document.getElementById("saveTemplateBtn").disabled = false;
  document.getElementById("deleteTemplateBtn").disabled = true;
  alert("삭제 완료되었습니다!");
}

export async function downloadTemplate() {
  const frame = document.getElementById("templateFrame");
  const canvas = await html2canvas(frame, {
    useCORS: true,
    scale: 1,
    backgroundColor: null
  });

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save("template.pdf");
}

// ✅ 페이지 진입 시 초기 처리 및 줌 바인딩
window.addEventListener("DOMContentLoaded", () => {
  if (window.top === window.self) {
    document.body.classList.add("view-mode");
    applyScale();
  }

  document.getElementById("saveTemplateBtn")?.addEventListener("click", saveTemplate);
  document.getElementById("deleteTemplateBtn")?.addEventListener("click", deleteTemplate);
  document.getElementById("downloadBtn")?.addEventListener("click", downloadTemplate);

  // HTML에서 직접 호출할 수 있도록 바인딩
  window.zoomIn = zoomIn;
  window.zoomOut = zoomOut;
  window.resetZoom = resetZoom;

});
