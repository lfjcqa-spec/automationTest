// src/core/step-registry.ts
import { envConfig } from '../config/env';

type StepFn = (page: any, data: any) => Promise<void>;

const registry: Record<string, StepFn> = {
  Login: async (_page, data) => {
    console.log(`[Login 模拟] baseUrl=${envConfig.baseUrl}, user=${data.name}, pwd=${data.pwd}`);
    // 👉 不再真的去 fill 输入框，只做模拟输出
  },

  Logout: async () => {
    console.log('[Logout 模拟]');
  },

  createProd: async (_page, data) => {
    console.log(`[CreateProd 模拟] code=${data.prodCode}, name=${data.prodName}`);
  },

  goToProdSection: async () => {
    console.log('[goToProdSection 模拟]');
  },

  checkMenu: async (_page, data) => {
    console.log(`[checkMenu 模拟] numOfMenu=${data.numOfMenu}, prodCode=${data.prodCode}`);
  },

  searchProduct: async (_page, data) => {
    console.log(`[searchProduct 模拟] prodCode=${data.prodCode}`);
  },

  checkBalace: async (_page, data) => {
    console.log(`[checkBalace 模拟] balance=${data.balance}`);
  },

  checkProductInfor: async (_page, data) => {
    console.log(`[checkProductInfor 模拟] name=${data.prodName}, size=${data.prodSize}`);
  },
};

export function resolveStep(stepName: string): StepFn {
  const fn = registry[stepName];
  if (!fn) throw new Error(`Step not implemented: ${stepName}`);
  return fn;
}
