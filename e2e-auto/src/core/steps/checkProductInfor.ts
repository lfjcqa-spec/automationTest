// e2e-auto/src/core/steps/checkProductInfor.ts
// 中文注释：checkProductInfor Step 的实现，模拟检查产品信息操作（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: checkProductInfor] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
}
