import { db, auth, storage } from "/muscat/common/firebase-init.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ✅ 토큰 제거
function stripToken(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}?alt=media`;
  } catch {
    return url;
  }
}

// ✅ 로딩 오버레이
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
console.log("✅ save-template-server.js 로드됨");
console.log("✅ saveBtn 존재 여부:", !!saveBtn);

const params = new URLSearchParams(window.location.search);
const currentDocId = params.get("docId");
let savedDocId = null;

// ✅ HTML 저장
async function uploadHTMLToStorage(htmlString, path) {
  const blob = new Blob([htmlString], { type: "text/html" });
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);
  return stripToken(url);
}

// ✅ 이미지 로드 대기
function waitForImageLoad(img) {
  return new Promise(resolve => {
    if (!img || !img.src) return resolve();
    if (img.complete && img.naturalHeight !== 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

// ✅ 확장자 추출
function getImageExtension(url) {
  if (url.startsWith("data:image/png")) return "png";
  if (url.startsWith("data:image/svg")) return "svg";
  if (url.startsWith("data:image/webp")) return "webp";
  return "jpg";
}
function isDataUrl(url) {
  return url.startsWith("data:");
}

// ✅ 이미지 업로드
async function uploadImageToStorage(base64Data, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Data, "data_url");
  const url = await getDownloadURL(storageRef);
  return stripToken(url);
}

// ✅ 템플릿 저장
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
    if (!htmlUrl) throw new Error("HTML 저장 실패");

    const pathname = window.location.pathname;
    const fileName = pathname.substring(pathname.lastIndexOf("/") + 1).split("?")[0];
    const templateId = fileName.replace(".html", "");

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

    // 모달 표시
    const modal = document.getElementById("saveCompleteModal");
    if (modal) modal.classList.add("active");
  } catch (e) {
    console.error("❌ 저장 실패:", e);
    alert("저장 중 오류 발생\n" + (e.message || e));
  } finally {
    hideLoading();
  }
}

// ✅ 템플릿 삭제 (Firestore + Storage)
async function handleDeleteTemplate() {
  const user = auth.currentUser;
  if (!user) return alert("로그인이 필요합니다.");
  if (!currentDocId) return alert("삭제할 템플릿이 없습니다.");

  const confirmDelete = confirm("정말 삭제하시겠습니까?");
  if (!confirmDelete) return;

  showLoading();
  try {
    const refDoc = doc(db, "savedTemplates", currentDocId);
    const snapshot = await getDoc(refDoc);
    if (!snapshot.exists()) throw new Error("문서를 찾을 수 없습니다.");

    const data = snapshot.data();
    const urls = [data.thumbnailUrl, data.logoUrl, data.imageUrl, data.htmlUrl];

    // Storage에서 삭제
    for (const url of urls) {
      if (!url) continue;
      try {
        const decodedPath = decodeURIComponent(new URL(url).pathname.split("/o/")[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("⚠️ Storage 삭제 실패 (무시):", e.message || e);
      }
    }

    // Firestore 문서 삭제
    await deleteDoc(refDoc);
    alert("템플릿이 삭제되었습니다.");
    window.location.href = "/muscat/mypage/my-save.html";
  } catch (e) {
    console.error("❌ 삭제 실패:", e);
    alert("삭제 중 오류 발생\n" + (e.message || e));
  } finally {
    hideLoading();
  }
}

// ✅ 버튼 이벤트 연결
saveBtn?.addEventListener("click", handleSaveTemplate);
deleteBtn?.addEventListener("click", handleDeleteTemplate);
