// e2e-auto/src/reporting/reporter.ts
// 中文注释：生成简单的 HTML 测试报告
import fs from "fs";

export function generateReport(results: string[]) {
  const html = `
  <html>
    <head><title>测试报告</title></head>
    <body>
      <h1>测试报告</h1>
      <ul>
        ${results.map(r => `<li>${r}</li>`).join("")}
      </ul>
    </body>
  </html>`;
  fs.writeFileSync("report.html", html, "utf-8"); // 中文注释：写入 report.html 文件
}
