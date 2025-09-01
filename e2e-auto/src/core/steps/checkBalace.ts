// e2e-auto/src/core/steps/checkBalace.ts
// 中文注释：checkBalace Step 的实现，模拟检查余额操作（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: checkBalace] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
}
