// edit-mode.js
import Moveable from "https://cdn.jsdelivr.net/npm/moveable@0.46.3/+esm";

// ✅ 편집 가능한 요소 리스트
const editableTargets = [
  ".brand-name",
  ".brand-slogan",
  "#brandLogo",
  ".image-container img"  // 변경: mainImage는 image-container 내부 제한
];

const moveables = [];

function enableMoveable(target) {
  const isImageInContainer = target.closest('.image-container');

  const moveable = new Moveable(document.body, {
    target,
    draggable: true,
    resizable: true,
    throttleResize: 1,
    keepRatio: false,
    edge: false,
    pinchable: false,
    bounds: isImageInContainer ? ".image-container" : { left: 0, top: 0 },
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

function destroyAllMoveables() {
  moveables.forEach(m => m.destroy());
  moveables.length = 0;
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

  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

// ✅ DOM 로드 시 감지 시작
window.addEventListener("DOMContentLoaded", () => {
  observeEditMode();

  // 진입 시 edit-mode 상태면 즉시 반영
  if (document.body.classList.contains("edit-mode")) {
    editableTargets.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) enableMoveable(el);
    });
  }
});
