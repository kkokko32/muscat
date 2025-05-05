// edit-mode.js

// ✅ 편집 가능한 요소 리스트
const editableTargets = [
    ".brand-name",
    ".brand-slogan",
    "#brandLogo",
    ".image-container img" // mainImage는 컨테이너 내부 제한
  ];
  
  const moveables = [];
  
  // ✅ Moveable 적용 함수
  function enableMoveable(target) {
    const isImageInContainer = target.closest(".image-container");
  
    const moveable = new window.Moveable(document.body, {
      target,
      draggable: true,
      resizable: true,
      throttleResize: 1,
      keepRatio: false,
      edge: false,
      pinchable: false,
      bounds: isImageInContainer ? ".image-container" : { left: 0, top: 0 }
    });
  
    moveable
      .on("drag", ({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        target.style.position = "absolute";
      })
      .on("resize", ({ target, width, height, drag }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.left = `${drag.left}px`;
        target.style.top = `${drag.top}px`;
        target.style.position = "absolute";
      });
  
    moveables.push(moveable);
  }
  
  // ✅ 모든 moveable 인스턴스 제거
  function destroyAllMoveables() {
    moveables.forEach(m => m.destroy());
    moveables.length = 0;
  }
  
  // ✅ 편집 모드 토글 함수 (전역 바인딩용)
  function toggleEditMode() {
    document.body.classList.toggle("edit-mode");
  }
  
  // ✅ 편집 모드 전환 감지
  function observeEditMode() {
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("edit-mode")) {
        editableTargets.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) enableMoveable(el);
        });
      } else {
        destroyAllMoveables();
      }
    });
  
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
  
  // ✅ DOM 로드 시 초기화
  window.addEventListener("DOMContentLoaded", () => {
    observeEditMode();
  
    // 진입 시 edit-mode가 이미 있으면 즉시 적용
    if (document.body.classList.contains("edit-mode")) {
      editableTargets.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) enableMoveable(el);
      });
    }
  });
  
  // ✅ HTML에서 직접 호출 가능하도록 바인딩
  window.toggleEditMode = toggleEditMode;
  