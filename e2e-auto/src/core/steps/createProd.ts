// e2e-auto/src/core/steps/createProd.ts
// 中文注释：createProd Step 的实现，模拟创建产品操作（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: createProd] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
}
