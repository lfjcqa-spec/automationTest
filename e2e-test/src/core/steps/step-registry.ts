import { builtins } from './builtins';

export const stepRegistry = {
  Login: builtins.openLogin,
  goToProdSection: builtins.print,
  createProd: builtins.print,
  Logout: builtins.print,
  checkBalance: builtins.print,
  searchProduct: builtins.print,
  checkProductInfo: builtins.print,
};
