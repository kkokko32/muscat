console.log("📦 save-template-server.js 불러와짐 ✅");

const saveBtn = document.getElementById("saveTemplateBtn");
console.log("✅ saveBtn 존재 여부:", !!saveBtn);

saveBtn?.addEventListener("click", () => {
  console.log("🧪 저장 버튼 클릭됨!");
});
