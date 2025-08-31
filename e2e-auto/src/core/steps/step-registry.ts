// 中文：步骤执行器注册表，提供 openLogin 与 print 等内置步骤
import { builtins } from './builtins.js';

export const stepRegistry = {
  openLogin: builtins.openLogin,
  print: builtins.print,
};
