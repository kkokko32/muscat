import { db } from '/muscat/common/firebase-init.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import {
  getStorage,
  ref,
  listAll,
  getMetadata
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const storage = getStorage();

async function getFolderSize(path) {
  const folderRef = ref(storage, path);
  const list = await listAll(folderRef);
  let totalBytes = 0;

  for (const item of list.items) {
    const meta = await getMetadata(item);
    totalBytes += meta.size;
  }

  return (totalBytes / (1024 * 1024)).toFixed(2); // MB
}

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

  // Storage 사용량 표시
  const imageSize = await getFolderSize("savedTemplates/images");
  const htmlSize = await getFolderSize("savedTemplates/htmls");
  const storageElem = document.getElementById("storageUsage");
  if (storageElem) {
    storageElem.innerText = `이미지: ${imageSize}MB / HTML: ${htmlSize}MB`;
  }
}

window.addEventListener('DOMContentLoaded', loadDashboardData);