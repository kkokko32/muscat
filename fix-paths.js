// fix-paths.js
const fs = require("fs");
const path = require("path");

const TARGET_EXTENSIONS = [".html", ".js"];
const TARGET_PREFIXES = ["/common/", "/components/", "/templates/", "/start/", "/mypage/", "/save-templates/", "/portfolio/"];

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

  const relativeDepth = path.relative(".", path.dirname(filePath)).split(path.sep).length;
  const prefix = "../".repeat(relativeDepth === 1 ? 0 : relativeDepth - 1);

  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  TARGET_PREFIXES.forEach(target => {
    const regex1 = new RegExp(`(src|href)=["']${target}`, "g");
    content = content.replace(regex1, `$1="${prefix}${target.slice(1)}`);

    const regex2 = new RegExp(`fetch\\(["']${target}`, "g");
    content = content.replace(regex2, `fetch("${prefix}${target.slice(1)}`);

    const regex3 = new RegExp(`from ["']${target.slice(1)}`, "g");
    content = content.replace(regex3, `from "${prefix}${target.slice(1)}`);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ 경로 수정됨: ${filePath}`);
  }
}

// 실행
walkDir(".", fixFile);
