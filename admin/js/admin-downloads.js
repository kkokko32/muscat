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
        <img src="${data.thumbnailUrl}" alt="썸네일" width="100%" />
        <p><strong>${data.templateId || docSnap.id}</strong></p>
        <p>브랜드: ${data.brand || "-"}</p>
        <p>사용자: ${data.userEmail || "-"}</p>
        <p>${data.createdAt?.toDate().toISOString().slice(0, 10) || "-"}</p>
        <button data-doc="${docSnap.id}" class="deleteBtn">삭제</button>
      `;
      listArea.appendChild(card);
    }

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
  } catch (err) {
    console.error("템플릿 불러오기 실패", err);
  }
});
