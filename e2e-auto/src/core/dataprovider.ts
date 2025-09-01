// e2e-auto/src/core/dataprovider.ts
// 中文注释：将数据库记录转换为数据提供者字典，并支持自动解析 JSON 字符串
export function toDataProvider(record: any): Record<string, any> {
  const provider: Record<string, any> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) continue;

    // 中文注释：如果值是字符串且看起来像 JSON，则尝试解析
    if (typeof value === "string" && (value.trim().startsWith("{") || value.trim().startsWith("["))) {
      try {
        provider[key] = JSON.parse(value);
        continue;
      } catch {
        // 中文注释：解析失败则保留原始字符串
      }
    }

    provider[key] = value;
  }

  return provider;
}
