// e2e-auto/src/core/steps/checkMenu.ts
// 中文注释：checkMenu Step 的实现，模拟检查菜单操作（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: checkMenu] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
}
