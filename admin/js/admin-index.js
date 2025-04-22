import { db } from '/muscat/common/firebase-init.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

async function loadDashboardData() {
  // 총 가입자 수
  const usersSnap = await getDocs(collection(db, 'users'));
  const userCount = usersSnap.size;
  document.getElementById('userCount').innerText = userCount + '명';

  // 총 다운로드 수
  const downloadsSnap = await getDocs(collection(db, 'downloads'));
  const downloadCount = downloadsSnap.size;
  document.getElementById('downloadCount').innerText = downloadCount + '건';

  // 인기 템플릿 Top 3
  const templateMap = {};
  downloadsSnap.forEach(doc => {
    const { templateId } = doc.data();
    if (templateId) {
      templateMap[templateId] = (templateMap[templateId] || 0) + 1;
    }
  });

  const sortedTemplates = Object.entries(templateMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topContainer = document.getElementById('topTemplates');
  topContainer.innerHTML = '';

  for (const [templateId, count] of sortedTemplates) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <img src="https://via.placeholder.com/180x240?text=${templateId}" alt="썸네일" />
      <p>ID: ${templateId}</p>
      <p>${count}회 다운로드</p>
    `;
    topContainer.appendChild(card);
  }
}

window.addEventListener('DOMContentLoaded', loadDashboardData);