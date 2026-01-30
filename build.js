const fs = require("fs");
const path = require("path");
const uglifyjs = require("uglify-js");

let css = "";
let js = "";

function handleFolder(folderPath, excludingFileName) {
  // 读取文件夹中的所有文件和子文件夹
  fs.readdirSync(folderPath).forEach((item) => {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      handleFolder(itemPath, excludingFileName);
    } else {
      if (item !== excludingFileName) {
        const fileContent = fs.readFileSync(itemPath, "utf8");
        if (item.includes(".css")) css += fileContent + "\r\n";
        if (item.includes(".js")) js += fileContent + "\r\n";
      }
    }
  });
}

function build() {
  handleFolder("./src", "main.js");
  css = css.replace(/\r\n/g, "");
  let template = fs.readFileSync("./src/main.js", "utf8");
  template = template.replace("/*编译器标记 勿删*/", css).replace("// 编译器标记 勿删", js);

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist");
  fs.writeFileSync("./dist/index.js", template);

  let header = "";
  // 修复：UserScript 头提取逻辑（更健壮，避免拆分失败）
  const mainContent = fs.readFileSync("./src/main.js", "utf8");
  const headerMatch = mainContent.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
  if (headerMatch) {
    header = headerMatch[0] + "\r\n";
  } else {
    // 兜底：未找到头信息时给出提示，避免打包出错
    console.warn("未找到 UserScript 头信息，打包后的脚本可能无法被油猴识别");
    header = "// ==UserScript==\r\n// @name 未知脚本\r\n// ==/UserScript==\r\n";
  }

  // 核心修改：优化 uglifyjs 压缩配置（保留油猴API、保留控制台日志）
  const result = uglifyjs.minify(template, {
    compress: {
      drop_console: false, // 不删除控制台日志（方便调试弹幕解析问题）
      warnings: false // 关闭压缩警告，避免冗余输出
    },
    mangle: {
      reserved: ["unsafeWindow", "GM_xmlhttpRequest"] // 保留油猴核心API，不被混淆
    }
  });

  // 新增：压缩失败捕获（避免脚本崩溃）
  if (result.error) {
    console.error("脚本压缩失败：", result.error);
    return;
  }

  fs.writeFileSync("./dist/index.user.js", header + result.code);
  console.log("打包成功！已生成 dist/index.js 和 dist/index.user.js");
}

build();
