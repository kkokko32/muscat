// admin-downloads.js
import { db } from "/muscat/common/firebase-init.js";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref as refFromURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", async () => {
  const listArea = document.getElementById("downloadCardArea");

  try {
    const snapshot = await getDocs(collection(db, "savedTemplates"));
    listArea.innerHTML = "";

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "template-card";
      card.innerHTML = `
        <img src="${data.thumbnailUrl}" alt="썸네일" class="previewImg" data-doc="${docSnap.id}" style="cursor: pointer;" />
        <p><strong>${data.templateId || docSnap.id}</strong></p>
        <p>브랜드: ${data.brand || "-"}</p>
        <p>사용자: ${data.userEmail || "-"}</p>
        <p>${data.createdAt?.toDate().toISOString().slice(0, 10) || "-"}</p>
        <button data-doc="${docSnap.id}" class="deleteBtn">삭제</button>
      `;
      listArea.appendChild(card);
    }

    // ✅ 삭제 기능
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const docId = btn.dataset.doc;
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
          const docRef = doc(db, "savedTemplates", docId);
          const docSnap = await getDoc(docRef);
          const data = docSnap.data();
          const storage = getStorage();

          const deletes = [];
          try {
            if (data.imageUrl?.startsWith("https://")) deletes.push(deleteObject(refFromURL(storage, data.imageUrl)));
            if (data.logoUrl?.startsWith("https://")) deletes.push(deleteObject(refFromURL(storage, data.logoUrl)));
            if (data.thumbnailUrl?.startsWith("https://")) deletes.push(deleteObject(refFromURL(storage, data.thumbnailUrl)));
            if (data.htmlUrl?.startsWith("https://")) deletes.push(deleteObject(refFromURL(storage, data.htmlUrl)));
          } catch (e) {
            console.warn("Storage 삭제 URL 오류", e);
          }

          await Promise.all([...deletes, deleteDoc(docRef)]);
          alert("삭제 완료");
          window.location.reload();
        } catch (err) {
          console.error("삭제 실패", err);
          alert("삭제 중 오류 발생");
        }
      });
    });

    // ✅ 썸네일 클릭 → 원본 템플릿 다운로드
    document.querySelectorAll(".previewImg").forEach((img) => {
      img.addEventListener("click", async () => {
        const docId = img.dataset.doc;
        if (!docId) return;

        try {
          const docRef = doc(db, "savedTemplates", docId);
          const snapshot = await getDoc(docRef);
          const data = snapshot.data();

          if (!data?.htmlUrl) return alert("원본 HTML이 없습니다.");

          const response = await fetch(data.htmlUrl);
          const htmlText = await response.text();
          const tempDom = document.createElement("div");
          tempDom.innerHTML = htmlText;

          const template = tempDom.querySelector(".template-frame");
          if (!template) return alert("디자인 프레임이 없습니다.");

          template.style.position = "absolute";
          template.style.left = "-9999px";
          document.body.appendChild(template);

          const canvas = await window.html2canvas(template, {
            useCORS: true,
            backgroundColor: null,
            scale: 3
          });

          document.body.removeChild(template);

          const link = document.createElement("a");
          link.download = `${data.brand || "template"}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        } catch (e) {
          console.error("다운로드 실패", e);
          alert("다운로드 중 오류 발생");
        }
      });
    });

  } catch (err) {
    console.error("템플릿 불러오기 실패", err);
  }
});
