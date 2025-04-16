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
  const iframes = document.querySelectorAll('.template-card iframe');
  iframes.forEach(iframe => {
    let templatePath = iframe.dataset.template;
    if (!templatePath.startsWith('/')) {
      templatePath = `/muscat/${templatePath}`;
    }
    iframe.src = templatePath;
    iframe.onload = () => resizeSingleIframe(iframe);
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

function updateTemplateInfoText() {
  // 필터 버튼이 포함된 #templateInfoText 영역을 건드리지 않음

}

function filterTemplates() {
  const industry = document.getElementById("selectedIndustry")?.innerText;
  const concept = document.getElementById("selectedConcept")?.innerText;
  const style = document.querySelector(".concept-filter .active")?.innerText;

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

// 실시간 입력 반영
function syncInputToIframe(id, value) {
  const iframes = document.querySelectorAll(".template-card.visible iframe");
  iframes.forEach(iframe => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const el = doc?.querySelector(`#${id}`);
    if (el) el.textContent = value;
  });

  updateLocalStorage();
}

function syncImageToIframe(id, file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;

    const iframes = document.querySelectorAll(".template-card.visible iframe");
    iframes.forEach(iframe => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const el = doc?.querySelector(`#${id}`);
      if (el) el.src = dataUrl;
    });

    if (id === "brandLogo") {
      localStorage.setItem("brandLogo", dataUrl);
    } else if (id === "mainImage") {
      localStorage.setItem("mainImage", dataUrl);
    }

    updateLocalStorage();
  };
  reader.readAsDataURL(file);
}

function updateLocalStorage() {
  const brand = document.getElementById("brandName")?.value || "";
  const slogan = document.getElementById("brandDesc")?.value || "";
  const logo = localStorage.getItem("brandLogo") || "";
  const main = localStorage.getItem("mainImage") || "";

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
      if (file) syncImageToIframe("brandLogo", file);
    });
  }

  if (mainImageInput) {
    mainImageInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) syncImageToIframe("mainImage", file);
    });
  }

  const firstIndustry = document.querySelector('#step1 .button-grid button');
  if (firstIndustry) firstIndustry.click();

  const firstConcept = document.querySelector('#step2 .button-grid button');
  if (firstConcept) firstConcept.click();

  const firstStyle = document.querySelector('.concept-filter button');
  if (firstStyle) firstStyle.click();
});
