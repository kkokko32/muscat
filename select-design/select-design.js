import { storage } from "/muscat/common/firebase-init.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ✅ 타자기 효과 함수
function typeEffect(text, targetId, callback) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      target.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(interval);
      callback?.();
    }
  }, 50);
}

// ✅ 예시 모달 열기/닫기
window.openExampleModal = () => {
  document.getElementById("exampleModal")?.classList.add("active");
};
window.closeExampleModal = () => {
  document.getElementById("exampleModal")?.classList.remove("active");
};

// ✅ '임의로 넣기' 클릭 시 로고 대신 텍스트 입력
window.insertBrandTextInsteadOfLogo = () => {
  const logoBtn = document.getElementById("logoUploadBtn");
  const brandInput = document.getElementById("brandTextAlt");
  if (logoBtn && brandInput) {
    logoBtn.classList.add("disabled");
    logoBtn.disabled = true;
    brandInput.style.display = "block";
  }
};

// ✅ 텍스트 입력 시 iframe 내 실시간 반영
function syncInputToIframe(id, value) {
  document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${id}`);
    if (el) el.textContent = value;
  });
  updateLocalStorage();
}

// ✅ 이미지 업로드 후 Storage 저장 + iframe에 반영
async function uploadToFirebaseAndPreview(file, imgElementId, storagePath, sessionKey) {
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  sessionStorage.setItem(sessionKey, downloadURL);

  document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${imgElementId}`);
    if (el) el.src = downloadURL;
  });
}

// ✅ 로컬 저장
function updateLocalStorage() {
  const brand = document.getElementById("brandName")?.value || "";
  const slogan = document.getElementById("brandDesc")?.value || "";
  const logo = sessionStorage.getItem("tempLogo") || brand;
  const main = sessionStorage.getItem("tempMain") || "";
  const data = { brand, slogan, logo, main };
  localStorage.setItem("templateData", JSON.stringify(data));
}

// ✅ 템플릿 클릭 시 상세페이지 이동
window.goToTemplate = (filename) => {
  updateLocalStorage();
  window.location.href = `/muscat/templates/templates-design/${filename}`;
};

// ✅ 디자인 대상 선택 시 필터링 + 다음 단계로
window.selectConcept = (button) => {
  document.querySelectorAll("#designTargetButtons button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  const selectedConcept = button.innerText;
  document.querySelectorAll(".template-card").forEach(card => {
    const concept = card.dataset.concept || "";
    if (!selectedConcept || selectedConcept === "전체" || concept.includes(selectedConcept)) {
      card.classList.add("visible");
    } else {
      card.classList.remove("visible");
    }
  });
  if (window.msnry) window.msnry.layout();

  // 다음 단계 등장
  const step2 = document.getElementById("step2");
  const brandTyping = document.getElementById("brandTypingText");
  const brandArea = document.getElementById("brandInputArea");
  if (step2 && brandTyping && brandArea) {
    step2.classList.remove("disabled");
    typeEffect("브랜드 정보를 입력하세요", "brandTypingText", () => {
      brandArea.classList.remove("hidden");
      brandArea.classList.add("visible");
    });
  }
};

// ✅ 스타일 필터링
window.selectStyle = (button) => {
  document.querySelectorAll(".inline-concept-filter button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  const selectedStyle = button.innerText;
  document.querySelectorAll(".template-card").forEach(card => {
    const style = card.dataset.style || "";
    if (!selectedStyle || selectedStyle === "전체" || style.includes(selectedStyle)) {
      card.classList.add("visible");
    } else {
      card.classList.remove("visible");
    }
  });
  if (window.msnry) window.msnry.layout();
};

// ✅ 초기화
document.addEventListener("DOMContentLoaded", () => {
  // Masonry 템플릿 정렬
  const grid = document.querySelector('.template-preview');
  window.msnry = new Masonry(grid, {
    itemSelector: '.template-card',
    columnWidth: 440,
    gutter: 16,
    fitWidth: true
  });

  imagesLoaded(grid, () => {
    document.querySelectorAll(".template-card iframe").forEach(iframe => {
      iframe.src = iframe.dataset.template;
    });
    window.msnry.layout();
  });

  // 브랜드명/슬로건 입력 실시간 반영
  const brandInput = document.getElementById("brandName");
  const descInput = document.getElementById("brandDesc");
  if (brandInput && descInput) {
    brandInput.addEventListener("input", () => {
      descInput.disabled = brandInput.value.trim() === "";
      syncInputToIframe("brandName", brandInput.value);
    });
    descInput.addEventListener("input", () => {
      syncInputToIframe("brandDesc", descInput.value);
    });
  }

  // 로고 업로드
  const logoInput = document.getElementById("logoInput");
  if (logoInput) {
    logoInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        const filename = `temp-logo-${Date.now()}`;
        uploadToFirebaseAndPreview(file, "brandLogo", `previews/${filename}`, "tempLogo");
      }
    });
  }

  // 메인 이미지 업로드
  const mainInput = document.getElementById("mainImageInput");
  if (mainInput) {
    mainInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        const filename = `temp-main-${Date.now()}`;
        uploadToFirebaseAndPreview(file, "mainImage", `previews/${filename}`, "tempMain");
      }
    });
  }

  // ✅ 모달 초기화 방지
  document.getElementById("exampleModal")?.classList.remove("active");

  // ✅ 최초 타자기 효과 → 버튼 등장
  typeEffect("디자인 대상을 선택하세요", "typingText", () => {
    const targetButtons = document.getElementById("designTargetButtons");
    if (targetButtons) {
      targetButtons.classList.remove("hidden");
      targetButtons.classList.add("visible");
    }
  });
});
