import { db } from '/muscat/common/firebase-init.js';
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const userCountEl = document.getElementById('userCount');
const downloadCountEl = document.getElementById('downloadCount');
const storageUsageEl = document.getElementById('storageUsage');
const topTemplatesEl = document.getElementById('topTemplates');

async function fetchStats() {
  const userSnap = await getCountFromServer(collection(db, 'users'));
  const downloadSnap = await getCountFromServer(collection(db, 'downloads'));

  userCountEl.textContent = `${userSnap.data().count}명`;
  downloadCountEl.textContent = `${downloadSnap.data().count}건`;
  storageUsageEl.innerHTML = `이미지: --MB<br>HTML: --MB`; // 추후 Storage API로 추가
}

async function fetchTopTemplates() {
  const q = query(collection(db, 'downloads'), orderBy('createdAt', 'desc'), limit(3));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <img src="${data.thumbnail}" alt="썸네일" />
      <p>${data.templateId}</p>
      <p>브랜드: ${data.brandName || '-'}</p>
      <p>${new Date(data.createdAt).toLocaleDateString()}</p>
    `;
    topTemplatesEl.appendChild(card);
  });
}

fetchStats();
fetchTopTemplates();