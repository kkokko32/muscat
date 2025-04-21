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

// 이미지 최적화 유틸리티

// 이미지 리사이징
async function resizeImage(file, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG 품질 0.85로 설정
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 이미지 로딩 상태 관리
function handleImageLoading(img) {
  return new Promise((resolve, reject) => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    }
  });
}

// 이미지 aspect ratio 유지하면서 커버/컨테인 맞추기
function fitImage(img, container, mode = 'cover') {
  const containerRect = container.getBoundingClientRect();
  const containerAspect = containerRect.width / containerRect.height;
  const imgAspect = img.naturalWidth / img.naturalHeight;

  if (mode === 'cover') {
    if (containerAspect > imgAspect) {
      img.style.width = '100%';
      img.style.height = 'auto';
    } else {
      img.style.width = 'auto';
      img.style.height = '100%';
    }
  } else { // contain
    if (containerAspect < imgAspect) {
      img.style.width = '100%';
      img.style.height = 'auto';
    } else {
      img.style.width = 'auto';
      img.style.height = '100%';
    }
  }
}

export { resizeImage, handleImageLoading, fitImage };

