// common/image-fit.js

function adjustTemplateCardHeights() {
    const thumbnails = document.querySelectorAll(".template-card .thumbnail");
  
    thumbnails.forEach(img => {
      if (!img.complete) {
        img.onload = () => adjustCard(img);
      } else {
        adjustCard(img);
      }
    });
  
    function adjustCard(img) {
      const card = img.closest(".template-card");
      const width = img.naturalWidth;
      const height = img.naturalHeight;
  
      if (card && width && height) {
        const fixedWidth = 278; // 카드 가로 고정값
        const ratio = height / width;
        const calculatedHeight = fixedWidth * ratio;
        card.style.height = `${calculatedHeight}px`;
      }
    }
  }
  
  // 페이지 로드 시 자동 실행 (선택사항)
  document.addEventListener("DOMContentLoaded", () => {
    adjustTemplateCardHeights();
  });

