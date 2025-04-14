// fix-paths.js
const fs = require("fs");
const path = require("path");

const TARGET_EXTENSIONS = [".html", ".js"];
const TARGET_PREFIXES = ["common/", "components/", "start/", "mypage/", "save-templates/", "templates/", "portfolio/", "index.css", "common.css"];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function fixFile(filePath) {
  const ext = path.extname(filePath);
  if (!TARGET_EXTENSIONS.includes(ext)) return;

  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  TARGET_PREFIXES.forEach(prefix => {
    // /로 시작하는 경로만 찾아서 상대 경로로 수정
    const regex = new RegExp(`(["'\(= ])${prefix}`, "g"); // 괄호, 따옴표 등 뒤에 붙는 형태
    content = content.replace(regex, `$1${prefix.slice(1)}`);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ 경로 수정됨: ${filePath}`);
  }
}

// 실행
console.log("📁 전체 경로 수정 중...");
walkDir(".", fixFile);
console.log("✅ 완료됨!");
