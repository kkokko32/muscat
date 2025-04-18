import { db, auth } from "/muscat/common/firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isManaging = false;

auth.onAuthStateChanged(user => {
  if (user) {
    loadMyTemplates();
  }
});

async function loadMyTemplates() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "savedTemplates"),
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  const container = document.getElementById("templateList");
  const countText = document.getElementById("template-count");
  const deleteBtn = document.getElementById("deleteSelectedBtn");

  if (!container) return;

  // ✅ 기존 내용 초기화
  container.innerHTML = '';

  // ✅ 총 개수 반영
  if (countText) {
    const count = snapshot.docs.length;
    countText.innerHTML = `총 <span class="highlight-number">${count}</span>개의 디자인을 저장했어요`;
  }

  if (snapshot.empty) {
    container.innerHTML = `<p class="no-template">저장된 템플릿이 없습니다.</p>`;
    if (deleteBtn) deleteBtn.style.display = "none";
    return;
  }

  const fragment = document.createDocumentFragment();

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

    if (data.thumbnailUrl) {
      const thumbnailWrapper = document.createElement("div");
      thumbnailWrapper.className = "thumbnail-wrapper";

      const previewImg = document.createElement("img");
      previewImg.src = data.thumbnailUrl;
      previewImg.alt = "저장된 템플릿 미리보기";
      previewImg.className = "thumbnail";

      thumbnailWrapper.appendChild(previewImg);
      wrapper.appendChild(thumbnailWrapper);
    }

    const brandP = document.createElement("h3");
    brandP.innerText = data.brand || "브랜드명 없음";
    wrapper.appendChild(brandP);

    const dateP = document.createElement("p");
    dateP.style.fontSize = "13px";
    dateP.style.margin = "0";
    dateP.style.color = "#999";

    if (data.createdAt?.toDate) {
      const createdDate = data.createdAt.toDate();
      const year = createdDate.getFullYear();
      const month = createdDate.getMonth() + 1;
      const day = createdDate.getDate();
      const hour = createdDate.getHours();
      const minute = createdDate.getMinutes();
      dateP.innerText = `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
    } else {
      dateP.innerText = "날짜 정보 없음";
    }

    wrapper.appendChild(dateP);

    // ✅ 카드 클릭 시 상세 페이지 이동
    wrapper.onclick = (e) => {
      if (e.target.classList.contains("select-checkbox")) return;
      if (isManaging) return;
      window.location.href = `/muscat/templates/templates-design/template-001.html?docId=${docId}`;
    };

    fragment.appendChild(wrapper);
  });

  container.appendChild(fragment);

  if (deleteBtn) {
    deleteBtn.style.display = isManaging ? "inline-block" : "none";
    deleteBtn.onclick = handleDelete;
  }
}

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

window.addEventListener("DOMContentLoaded", () => {
  const manageBtn = document.getElementById("manageModeBtn");
  if (manageBtn) {
    manageBtn.addEventListener("click", () => {
      isManaging = !isManaging;
      manageBtn.innerText = isManaging ? "완료" : "관리";
      loadMyTemplates();
    });
  }

  if (auth.currentUser) {
    loadMyTemplates();
  }
});
