import { auth, storage } from "/muscat/common/firebase-init.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ✅ 타자기 효과
function typeEffect(text, targetId, callback) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = "";
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      const char = text.charAt(i) === "\n" ? "<br>" : text.charAt(i);
      target.innerHTML += char;
      i++;
    } else {
      clearInterval(interval);
      callback?.();
    }
  }, 50);
}

// ✅ 모달 열기/닫기
window.openExampleModal = () => {
  document.getElementById("exampleModal")?.classList.add("active");
};
window.closeExampleModal = () => {
  document.getElementById("exampleModal")?.classList.remove("active");
};

// ✅ '임의로 넣기' 처리
window.insertBrandTextInsteadOfLogo = () => {
  const logoBtn = document.getElementById("logoUploadBtn");
  const brandInput = document.getElementById("brandName");

  if (logoBtn && brandInput) {
    logoBtn.classList.add("disabled");
    logoBtn.disabled = true;

    brandInput.classList.remove("hidden");
    brandInput.classList.add("fade-in");
    brandInput.focus();

    document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      // 기존 이미지 숨김
      const logoImg = doc?.getElementById("brandLogo");
      if (logoImg) {
        logoImg.style.display = "none";
        logoImg.src = ""; // 완전히 비움
      }

      // 텍스트 div 생성 또는 갱신
      let textDiv = doc?.getElementById("brandLogoText");
      if (!textDiv) {
        textDiv = doc.createElement("div");
        textDiv.id = "brandLogoText";
        textDiv.style.fontSize = "28px";
        textDiv.style.fontWeight = "bold";
        textDiv.style.color = "#333";
        textDiv.style.marginBottom = "40px";
        textDiv.style.textAlign = "center";

        logoImg?.parentNode?.insertBefore(textDiv, logoImg.nextSibling);
      }

      textDiv.textContent = brandInput.value || "브랜드명";
    });

    // 입력 감지: 로고 텍스트만 반영 (브랜드명에는 반영 안 함)
    brandInput.addEventListener("input", () => {
      document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const textDiv = doc?.getElementById("brandLogoText");
        if (textDiv) textDiv.textContent = brandInput.value;
      });
      // 저장 시 텍스트로 들어가게 세션에도 저장
      sessionStorage.setItem("tempLogo", "__TEXT__:" + brandInput.value);
    });
  }
};


// ✅ 입력 실시간 반영
function syncInputToIframe(id, value) {
  document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${id}`);
    if (el) el.textContent = value;

    // ✅ brandName 입력 시 텍스트형 로고에도 반영
    if (id === "brandName") {
      const logoText = doc?.getElementById("brandLogoText");
      if (logoText) logoText.textContent = value;
    }
  });
  updateLocalStorage();
}

// ✅ 이미지 업로드 + 반영
async function uploadToFirebaseAndPreview(file, imgElementId, storagePath, sessionKey) {
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  sessionStorage.setItem(sessionKey, downloadURL);

  document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${imgElementId}`);
    if (el) {
      el.src = downloadURL;
      el.style.display = "block"; // ✅ 이미지가 안 보일 경우 보이도록 설정
    }
  });
}

// ✅ 로컬 저장
function updateLocalStorage() {
  const slogan = document.getElementById("brandDesc")?.value || "";

  const logoSession = sessionStorage.getItem("tempLogo") || "";
  let brand = "";

  // 텍스트 로고가 아닐 때만 브랜드명 저장
  if (!logoSession.startsWith("__TEXT__:")) {
    brand = document.getElementById("brandName")?.value || "";
  }

  const data = { brand, slogan, logo: logoSession };
  localStorage.setItem("templateData", JSON.stringify(data));
}

// ✅ 상세페이지 이동
window.goToTemplate = (filename) => {
  updateLocalStorage();
  window.location.href = `/muscat/templates/${filename}`;
};

// ✅ 디자인 대상 선택 → 다음 단계
window.selectConcept = (button) => {
  const buttons = document.querySelectorAll("#designTargetButtons button");
  buttons.forEach(btn => {
    btn.classList.remove("active");
    btn.classList.add("dimmed");
  });

  button.classList.remove("dimmed");
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

  const typingText = document.getElementById("typingText");
  if (typingText) typingText.classList.add("text-fade-out");

  showBrandStep();
};

// ✅ 브랜드 입력 단계 등장 로직
function showBrandStep() {
  const step2 = document.getElementById("step2");
  const typing = document.getElementById("brandTypingText");
  const uploadGroup = document.getElementById("brandUploadGroup");
  const textAlt = document.getElementById("brandTextAlt");

  if (!step2 || !typing || !uploadGroup || !textAlt) {
    console.warn("showBrandStep 실패: 요소 누락");
    return;
  }

  // ✅ 현재 스텝을 sessionStorage에 저장
  sessionStorage.setItem("currentStep", "brand");

  step2.classList.remove("disabled");
  typing.classList.remove("hidden");

  typeEffect("브랜드 로고를 넣어볼게요\n로고 이미지 파일이 있으신가요?", "brandTypingText", () => {
    document.getElementById("brandTypingText")?.classList.add("text-fade-out");

    uploadGroup.classList.remove("hidden");
    uploadGroup.classList.add("fade-in");

    setTimeout(() => {
      textAlt.classList.remove("hidden");
      textAlt.classList.add("fade-in");
    }, 400);
  });
}


// ✅ 스타일 선택 필터링
window.selectStyle = (button) => {
  const buttons = document.querySelectorAll(".inline-concept-filter button");
  buttons.forEach(btn => {
    btn.classList.remove("active");
    btn.classList.add("dimmed");
  });

  button.classList.remove("dimmed");
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

// ✅ iframe 축소 및 스타일 적용
function resizeSingleIframe(iframe) {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  const frame = doc?.querySelector('.template-frame');
  const url = iframe.getAttribute("data-template");

  if (!frame) {
    iframe.style.width = `440px`;
    iframe.style.height = `1200px`;
    iframe.style.border = "none";
    const card = iframe.closest(".template-card");
    if (card) {
      card.style.width = `440px`;
      card.style.height = `1200px`;
    }
    return;
  }

  const originalWidth = frame.offsetWidth || 2480;
  const originalHeight = frame.offsetHeight || 3508;
  const targetWidth = 440;
  const ratio = targetWidth / originalWidth;
  const targetHeight = originalHeight * ratio;

  iframe.style.width = `${originalWidth}px`;
  iframe.style.height = `${originalHeight}px`;
  iframe.style.border = "none";
  iframe.style.transform = `scale(${ratio})`;
  iframe.style.transformOrigin = "top left";

  const card = iframe.closest(".template-card");
  if (card) {
    card.style.width = `${targetWidth}px`;
    card.style.height = `${targetHeight}px`;
    card.style.overflow = "hidden";
  }

  doc.body.classList.add("inside-preview");
  const style = doc.createElement("style");
  style.textContent = `
    #saveTemplateBtn,
    #deleteTemplateBtn,
    #downloadBtn,
    .template-close {
      display: none !important;
    }
    body.inside-preview .template-frame {
      margin-top: 0 !important;
    }
  `;
  doc.head.appendChild(style);

  if (window.msnry) window.msnry.layout();
}

// ✅ 초기화
document.addEventListener("DOMContentLoaded", () => {
  // ✅ 템플릿 카드 표시 및 Masonry 초기화는 항상 실행되도록 최상단 배치
  document.querySelectorAll(".template-card").forEach(card => {
    card.classList.add("visible");
  });

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
    iframe.onload = () => {
      resizeSingleIframe(iframe);

      // ✅ 이미지 vs 텍스트 로고 상태 동기화
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const logoText = doc?.getElementById("brandLogoText");
      const logoImg = doc?.getElementById("brandLogo");

      const logoData = sessionStorage.getItem("tempLogo") || "";
      if (logoData.startsWith("__TEXT__:")) {
        // 텍스트만 보이게
        if (logoText) {
          logoText.textContent = logoData.replace("__TEXT__:", "");
          logoText.style.display = "block";
        }
        if (logoImg) {
          logoImg.src = "";
          logoImg.style.display = "none";
        }
      } else if (logoData) {
        // 이미지만 보이게
        if (logoImg) {
          logoImg.src = logoData;
          logoImg.style.display = "block";
        }
        if (logoText) {
          logoText.style.display = "none";
        }
      }
    };
  });
  window.msnry.layout();
});


  // ✅ '디자인 시작하기'로 새 진입한 경우 복귀 기록 및 스텝 초기화
  if (sessionStorage.getItem("entryType") === "new") {
    sessionStorage.removeItem("returnFromTemplate");
    sessionStorage.removeItem("currentStep"); // step2 자동 진입 방지
    sessionStorage.removeItem("entryType");   // 플래그 제거
  }

  // ✅ 상세페이지에서 복귀 시: 타자기 효과 생략하고 바로 step2 진입
  const isReturn = sessionStorage.getItem("returnFromTemplate") === "true";
  if (isReturn && sessionStorage.getItem("currentStep") === "brand") {
    const typingText = document.getElementById("typingText");
    const step1 = document.getElementById("designTargetButtons");
    const helpText = document.getElementById("selectionHelpText");

    // ✅ 문구 복원 + 색상 복원
    if (typingText) {
      typingText.innerText = "디자인 대상을 선택하세요";
      typingText.classList.remove("hidden");
      typingText.classList.add("text-fade-out"); // 색상 복원
    }

    step1?.classList.remove("hidden", "text-fade-out");
    step1?.classList.add("visible");
    helpText?.classList.remove("hidden");
    helpText?.classList.add("visible");

    showBrandStep(); // step2 직접 진입
    sessionStorage.removeItem("returnFromTemplate");
    return; // ✅ 타자기 애니메이션 생략
  }

  // ✅ 모달 초기 닫기
  setTimeout(() => {
    const modal = document.getElementById("exampleModal");
    if (modal) modal.classList.remove("active");
  }, 100);

   // ✅ 브랜드 입력 실시간 반영
const brandInput = document.getElementById("brandName");
const descInput = document.getElementById("brandDesc");
if (brandInput && descInput) {
  brandInput.addEventListener("input", () => {
    const brandName = brandInput.value;
    descInput.disabled = brandName.trim() === "";
    syncInputToIframe("brandName", brandName);

    // ✅ 텍스트형 로고일 때만 반영 (이미지일 경우 무시)
    const logoData = sessionStorage.getItem("tempLogo") || "";
    if (logoData.startsWith("__TEXT__:")) {
      document.querySelectorAll(".template-card.visible iframe").forEach(iframe => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const textDiv = doc?.getElementById("brandLogoText");
        if (textDiv) textDiv.textContent = brandName;
      });
    }
  });

  descInput.addEventListener("input", () => {
    syncInputToIframe("brandDesc", descInput.value);
  });
}


  // ✅ 로고 이미지 업로드
  const logoInput = document.getElementById("logoInput");
  if (logoInput) {
    logoInput.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;

      const user = auth.currentUser;
      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const filename = `temp-logo-${Date.now()}`;
      const storagePath = `temp-uploads/${user.uid}/${filename}`;
      await uploadToFirebaseAndPreview(file, "brandLogo", storagePath, "tempLogo");
    });
  }

  // ✅ 초기 타자기 효과 시작
  const typingText = document.getElementById("typingText");
  if (typingText) {
    typingText.classList.remove("hidden");
    typingText.textContent = "디자인 대상을 선택하세요";
  }

  typeEffect("디자인 대상을 선택하세요", "typingText", () => {
    const targetButtons = document.getElementById("designTargetButtons");
    if (targetButtons) {
      setTimeout(() => {
        targetButtons.classList.remove("hidden");
        targetButtons.classList.add("visible");

        typingText.classList.add("text-fade-out");

        setTimeout(() => {
          const helpText = document.getElementById("selectionHelpText");
          if (helpText) {
            helpText.classList.remove("hidden");
            helpText.classList.add("visible");
          }

          // ✅ 저장된 스텝이 brand이면 step2 자동 실행
          const savedStep = sessionStorage.getItem("currentStep");
          if (savedStep === "brand") {
            showBrandStep();
          }

        }, 400);
      }, 500);
    }
  });
});
