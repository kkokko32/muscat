import { db, storage } from "/muscat/common/firebase-init.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  listAll,
  getMetadata
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

async function getUserCount() {
  const snapshot = await getDocs(collection(db, "users"));
  document.getElementById("userCount").textContent = `${snapshot.size}명`;
}

async function getDownloadCount() {
  const snapshot = await getDocs(collection(db, "downloads"));
  document.getElementById("downloadCount").textContent = `${snapshot.size}건`;
}

async function calculateStorageUsage() {
  let totalBytes = 0;
  const paths = ["savedTemplates/images", "savedTemplates/htmls"];

  for (const path of paths) {
    const listRef = ref(storage, path);
    const res = await listAll(listRef);
    const sizes = await Promise.all(res.items.map(item => getMetadata(item).then(meta => meta.size || 0)));
    totalBytes += sizes.reduce((a, b) => a + b, 0);
  }

  const mb = (totalBytes / 1024 / 1024).toFixed(2);
  document.getElementById("storageUsage").textContent = `${mb}MB`;
}

async function loadTopTemplates() {
  const snapshot = await getDocs(query(collection(db, "downloads"), orderBy("templateId")));
  const counts = {};
  snapshot.forEach(doc => {
    const t = doc.data().templateId;
    counts[t] = (counts[t] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const container = document.getElementById("topTemplates");
  container.innerHTML = "";

  for (const [templateId, count] of sorted) {
    const card = document.createElement("div");
    card.className = "template-card";
    card.innerHTML = `<strong>${templateId}</strong><br>다운로드 수: ${count}`;
    container.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getUserCount().catch(console.error);
  getDownloadCount().catch(console.error);
  calculateStorageUsage().catch(console.error);
  loadTopTemplates().catch(console.error);
});