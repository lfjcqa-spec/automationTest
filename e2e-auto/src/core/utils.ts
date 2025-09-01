// src/core/utils.ts

/**
 * 从对象中获取可能的字段，如果不存在返回默认值
 *
 * @param obj - 数据对象
 * @param possibleKeys - 可能的字段名集合
 * @param defaultValue - 默认值（没有匹配时返回）
 */
export function getField(obj: any, possibleKeys: string[], defaultValue = 'unknown'): string {
  for (const key of possibleKeys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return String(obj[key]);
    }
  }
  return defaultValue;
}

/**
 * 简单的 sleep 工具方法
 *
 * @param ms - 毫秒
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成随机 ID（测试数据可用）
 */
export function randomId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}
