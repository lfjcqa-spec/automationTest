// e2e-auto/src/core/steps/goToProdSection.ts
// 中文注释：goToProdSection Step 的实现，模拟导航到产品section（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: goToProdSection] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
}
