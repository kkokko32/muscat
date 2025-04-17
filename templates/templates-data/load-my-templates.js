import { db, auth } from "/muscat/common/firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isManaging = false;

auth.onAuthStateChanged(user => {
  if (user) {
    loadMyTemplates(); // ✅ auth가 준비된 뒤에만 호출
  }
});

async function loadMyTemplates() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "savedTemplates"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  const container = document.getElementById("templateList") || document.getElementById("saved-template-list");
  const countText = document.getElementById("template-count");
  const deleteBtn = document.getElementById("deleteSelectedBtn");

  if (countText) {
    const count = snapshot.docs.length;
    countText.innerHTML = `총 <span class="highlight-number">${count}</span>개의 디자인을 저장했어요`;
  }

  if (!container) return;
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = `<p class="no-template">저장된 템플릿이 없습니다.</p>`;
    if (deleteBtn) deleteBtn.style.display = "none";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;

    const wrapper = document.createElement("div");
    wrapper.className = "template-card";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-checkbox";
    checkbox.setAttribute("data-id", docId);
    checkbox.style.display = isManaging ? "block" : "none";
    wrapper.appendChild(checkbox);

    // ✅ 썸네일 (조건 없이 생성, fallback 제공)
    const thumbnailWrapper = document.createElement("div");
    thumbnailWrapper.className = "thumbnail-wrapper";

    const previewImg = document.createElement("img");
    previewImg.src = data.thumbnailUrl || "/muscat/images/placeholder-thumbnail.jpg";
    previewImg.alt = "저장된 템플릿 미리보기";
    previewImg.className = "thumbnail";

    thumbnailWrapper.appendChild(previewImg);
    wrapper.appendChild(thumbnailWrapper);

    // 브랜드명
    const brandP = document.createElement("p");
    brandP.style.textAlign = "center";
    brandP.style.fontWeight = "bold";
    brandP.style.marginTop = "8px";
    brandP.innerText = data.brand || "브랜드명 없음";
    wrapper.appendChild(brandP);

    // 저장 시간
    if (data.createdAt?.toDate) {
      const createdDate = data.createdAt.toDate();
      const dateP = document.createElement("p");
      dateP.style.textAlign = "center";
      dateP.style.fontSize = "13px";
      dateP.style.color = "#666";
      dateP.style.margin = "0";

      const year = createdDate.getFullYear();
      const month = createdDate.getMonth() + 1;
      const day = createdDate.getDate();
      const hour = createdDate.getHours();
      const minute = createdDate.getMinutes();

      dateP.innerText = `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
      wrapper.appendChild(dateP);
    }

    wrapper.onclick = (e) => {
      if (e.target.classList.contains("select-checkbox")) return;
      if (isManaging) return;
      window.location.href = `/muscat/templates/templates-design/template-001.html?docId=${docId}`;
    };

    container.appendChild(wrapper);
  });

  adjustTemplateCardHeights();

  if (deleteBtn) {
    deleteBtn.style.display = isManaging ? "inline-block" : "none";
    deleteBtn.onclick = handleDelete;
  }
}

function adjustTemplateCardHeights() {
  const cards = document.querySelectorAll(".template-card");
  let maxHeight = 0;

  cards.forEach(card => {
    card.style.height = "auto";
    maxHeight = Math.max(maxHeight, card.offsetHeight);
  });

  cards.forEach(card => {
    card.style.height = `${maxHeight}px`;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const manageBtn = document.getElementById("manageModeBtn");
  if (manageBtn) {
    manageBtn.addEventListener("click", () => {
      isManaging = !isManaging;
      manageBtn.innerText = isManaging ? "완료" : "관리";
      loadMyTemplates(); // ✅ 관리모드 토글 시 강제 호출
    });
  }
});

async function handleDelete() {
  const confirmDelete = confirm("선택한 템플릿을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const checkboxes = document.querySelectorAll(".select-checkbox:checked");
  for (const cb of checkboxes) {
    const docId = cb.getAttribute("data-id");
    if (docId) {
      await deleteDoc(doc(db, "savedTemplates", docId));
    }
  }

  alert("삭제가 완료되었습니다.");
  loadMyTemplates();
}
