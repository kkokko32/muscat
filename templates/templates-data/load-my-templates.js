import { db, auth } from "common/firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isManaging = false;

// 로그인 완료 후 실행
auth.onAuthStateChanged(user => {
  if (user) {
    loadMyTemplates();
  }
});

async function loadMyTemplates() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "savedTemplates"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  const container = document.getElementById("saved-template-list") || document.getElementById("templateList");
  const countText = document.getElementById("template-count");
  const deleteBtn = document.getElementById("deleteSelectedBtn");

  if (!container) return;
  container.innerHTML = "";

  // 템플릿 개수 표시
  if (countText) {
    countText.innerText = `총 ${snapshot.size}개`;
  }

  // 템플릿 없을 경우 문구
  if (snapshot.empty) {
    container.innerHTML = `<p class="no-template">저장된 템플릿이 없습니다.</p>`;
    if (deleteBtn) deleteBtn.style.display = "none";
    return;
  }

  // 템플릿 렌더링
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;

    const wrapper = document.createElement("div");
    wrapper.className = "template-card";

    // 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-checkbox";
    checkbox.setAttribute("data-id", docId);
    checkbox.style.display = isManaging ? "block" : "none";
    wrapper.appendChild(checkbox);

    // 썸네일 이미지
    if (data.thumbnail) {
      const thumbnailWrapper = document.createElement("div");
      thumbnailWrapper.className = "thumbnail-wrapper";

      const previewImg = document.createElement("img");
      previewImg.src = data.thumbnail;
      previewImg.alt = "저장된 템플릿 미리보기";
      previewImg.className = "thumbnail";

      thumbnailWrapper.appendChild(previewImg);
      wrapper.appendChild(thumbnailWrapper);
    }

    // 브랜드명 텍스트
    const brandP = document.createElement("p");
    brandP.style.textAlign = "center";
    brandP.style.fontWeight = "bold";
    brandP.style.marginTop = "8px";
    brandP.innerText = data.brand || "브랜드명 없음";
    wrapper.appendChild(brandP);

    // 클릭 시 상세페이지 이동 (체크박스 클릭 제외)
    wrapper.onclick = (e) => {
      if (e.target.classList.contains("select-checkbox")) return;
      if (isManaging) return;
      window.location.href = `/templates/templates-design/template-001.html?docId=${docId}`;
    };

    container.appendChild(wrapper);
  });

  // 삭제 버튼 상태 반영
  if (deleteBtn) {
    deleteBtn.style.display = isManaging ? "inline-block" : "none";
    deleteBtn.onclick = handleDelete;
  }
}

// 관리 모드 토글
window.addEventListener("DOMContentLoaded", () => {
  const manageBtn = document.getElementById("manageModeBtn");
  if (manageBtn) {
    manageBtn.addEventListener("click", () => {
      isManaging = !isManaging;
      manageBtn.innerText = isManaging ? "완료" : "관리";
      loadMyTemplates();
    });
  }
});

// 삭제 기능
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
