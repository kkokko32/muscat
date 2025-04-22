// admin-templates.js
import { db } from "/muscat/common/firebase-init.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("templateTableBody");
  tbody.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "savedTemplates"));
    snapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${doc.id}</td>
        <td><img src="${data.thumbnailUrl}" width="100" /></td>
        <td>${data.industry || "-"}</td>
        <td>${data.concept || "-"}</td>
        <td>${data.color || "-"}</td>
        <td>${data.visible ? "O" : "X"}</td>
        <td>${data.downloadCount || 0}</td>
        <td><button>비노출</button></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("템플릿 불러오기 실패", err);
  }
});