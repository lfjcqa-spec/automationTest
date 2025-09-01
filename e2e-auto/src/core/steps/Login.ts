// e2e-auto/src/core/steps/Login.ts
// 中文注释：Login Step 的实现，模拟登录操作（目前用打印模仿）
import { TestContext } from "../context";

export async function run(ctx: TestContext, data: Record<string, any>) {
  console.log("🚀 [Step: Login] 被调用");
  console.log("参数:", JSON.stringify(data, null, 2));
  // 中文注释：实际实现可添加：await ctx.page.goto(ctx.env.baseUrl); await ctx.page.fill('#username', data.name); 等
}
