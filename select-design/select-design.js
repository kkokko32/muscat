import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { storage } from "/muscat/common/firebase-init.js";

// ✅ 로딩 오버레이 제어 함수
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "flex";
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = "none";
}

function resizeSingleIframe(iframe) {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  const frame = doc?.querySelector('.template-frame');
  const url = iframe.getAttribute("data-template");

  if (!frame) {
    console.warn(`template-frame 없음: ${url}`);
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

  const originalWidth = frame.offsetWidth || 560;
  const originalHeight = frame.offsetHeight || 900;
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

  if (window.msnry) {
    window.msnry.layout();
  }
}

function loadTemplatesToIframes() {
  showLoading();

  const iframes = document.querySelectorAll('.template-card iframe');
  let loadedCount = 0;
  const total = iframes.length;

  iframes.forEach(iframe => {
    let templatePath = iframe.dataset.template;
    if (!templatePath.startsWith('/')) {
      templatePath = `/muscat/${templatePath}`;
    }
    iframe.src = templatePath;

    const onIframeDone = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        iframeDoc?.body?.classList.add("inside-preview");

        const style = iframeDoc?.createElement("style");
        if (style) {
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
          iframeDoc.head.appendChild(style);
        }
      } catch (e) {
        console.warn("iframe 접근 실패:", e);
      }

      resizeSingleIframe(iframe);
      loadedCount++;
      if (loadedCount === total) {
        setTimeout(hideLoading, 300);
      }
    };

    iframe.onload = onIframeDone;
    iframe.onerror = onIframeDone;
  });
}

function selectIndustry(button) {
  document.querySelectorAll("#step1 .button-grid button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  const selected = button.innerText;
  const target = document.getElementById("selectedIndustry");
  if (target) target.innerText = selected;
  document.getElementById("step2")?.classList.remove("disabled");
  updateTemplateInfoText();
  filterTemplates();
}

function selectConcept(button) {
  document.querySelectorAll("#step2 .button-grid button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  const selected = button.innerText;
  const target = document.getElementById("selectedConcept");
  if (target) target.innerText = selected;
  document.getElementById("step3")?.classList.remove("disabled");
  updateTemplateInfoText();
  filterTemplates();
}

function selectStyle(button) {
  document.querySelectorAll(".inline-concept-filter button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  const selected = button.innerText;
  const target = document.getElementById("selectedStyle");
  if (target) target.innerText = selected;
  filterTemplates();
}

function updateTemplateInfoText() {}

function filterTemplates() {
  const industry = document.getElementById("selectedIndustry")?.innerText;
  const concept = document.getElementById("selectedConcept")?.innerText;
  const style = document.querySelector(".inline-concept-filter .active")?.innerText;
  document.querySelectorAll(".template-card").forEach(card => {
    const matchIndustry = !industry || industry === "전체" || card.dataset.industry === industry;
    const matchConcept = !concept || concept === "전체" || card.dataset.concept === concept;
    const matchStyle = !style || style === "전체" || (card.dataset.style || "").includes(style);
    if (matchIndustry && matchConcept && matchStyle) {
      card.classList.add("visible");
    } else {
      card.classList.remove("visible");
    }
  });
  if (window.msnry) {
    window.msnry.layout();
  }
}

function syncInputToIframe(id, value) {
  const iframes = document.querySelectorAll(".template-card.visible iframe");
  iframes.forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${id}`);
    if (el) el.textContent = value;
  });
  updateLocalStorage();
}

async function uploadToFirebaseAndPreview(file, imgElementId, storagePath, sessionKey) {
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  const img = document.getElementById(imgElementId);
  if (img) {
    img.src = downloadURL;
    img.style.display = "block";
  } else {
    console.warn(`[경고] id='${imgElementId}' 요소를 찾을 수 없습니다.`);
  }
  sessionStorage.setItem(sessionKey, downloadURL);
  const iframes = document.querySelectorAll(".template-card.visible iframe");
  iframes.forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${imgElementId}`);
    if (el) el.src = downloadURL;
  });
}

function updateLocalStorage() {
  const brand = document.getElementById("brandName")?.value || "";
  const slogan = document.getElementById("brandDesc")?.value || "";
  const logo = sessionStorage.getItem("tempLogo") || "";
  const main = sessionStorage.getItem("tempMain") || "";
  const data = { brand, slogan, logo, main };
  localStorage.setItem("templateData", JSON.stringify(data));
}

function goToTemplate(filename) {
  updateLocalStorage();
  window.location.href = `/muscat/templates/templates-design/${filename}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector('.template-preview');
  window.msnry = new Masonry(grid, {
    itemSelector: '.template-card',
    columnWidth: 440,
    gutter: 16,
    fitWidth: true
  });
  imagesLoaded(grid, () => {
    loadTemplatesToIframes();
    window.msnry.layout();
  });

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

  const logoInput = document.getElementById("logoInput");
  const mainImageInput = document.getElementById("mainImageInput");
  if (logoInput) {
    logoInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        const filename = `temp-logo-${Date.now()}`;
        uploadToFirebaseAndPreview(file, "brandLogo", `previews/${filename}`, "tempLogo");
      }
    });
  }
  if (mainImageInput) {
    mainImageInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        const filename = `temp-main-${Date.now()}`;
        uploadToFirebaseAndPreview(file, "mainImage", `previews/${filename}`, "tempMain");
      }
    });
  }

  const firstIndustry = document.querySelector('#step1 .button-grid button');
  if (firstIndustry) firstIndustry.click();
  const firstConcept = document.querySelector('#step2 .button-grid button');
  if (firstConcept) firstConcept.click();
  const firstStyle = document.querySelector('.inline-concept-filter button');
  if (firstStyle) firstStyle.click();
});

window.selectIndustry = selectIndustry;
window.selectConcept = selectConcept;
window.selectStyle = selectStyle;

// ✅ 디자인 사이즈 필터 함수 등록
function selectSize(button) {
  document.querySelectorAll("#step2 .button-grid:nth-of-type(2) button").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  filterTemplates();
}
window.selectSize = selectSize;