// admin-users.js
import { db } from "/muscat/common/firebase-init.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userBody = document.getElementById("userTableBody");
  const downloadSection = document.getElementById("downloadDetailSection");
  const downloadList = document.getElementById("downloadList");

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    userBody.innerHTML = "";

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${userData.email}</td>
        <td>${userData.createdAt?.toDate().toISOString().slice(0, 10) || "-"}</td>
        <td>${userData.savedCount || 0}</td>
        <td><button data-uid="${userDoc.id}" class="show-downloads">보기</button></td>
      `;
      userBody.appendChild(tr);
    }

    document.querySelectorAll(".show-downloads").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const uid = btn.dataset.uid;
        const q = query(collection(db, "downloads"), where("userId", "==", uid));
        const snapshot = await getDocs(q);

        downloadList.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const item = document.createElement("li");
          const dateStr = data.createdAt?.toDate().toISOString().slice(0, 10) || "-";
          item.textContent = `${data.templateId} / ${data.brand || "-"} / ${dateStr}`;
          downloadList.appendChild(item);
        });

        downloadSection.style.display = "block";
      });
    });
  } catch (err) {
    console.error("사용자 불러오기 실패", err);
  }
});