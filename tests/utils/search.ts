/**
 * 通用搜索查询构建器（以 Google 语法为主，Bing/其他也大多兼容）
 * 功能点：
 * - 关键字/短语/必须包含/排除词
 * - 站点/子域/多站点
 * - 文件类型、inurl/intitle 过滤
 * - 时间范围（after/before/year/month/day）
 * - 语言/地区限定（lr、cr 等）
 * - OR 组合（任意一个命中即可）
 * - 自动清洗、去重、空值忽略
 * - 支持从环境变量加载默认值
 */

export type TimeRange =
  | { after?: string; before?: string } // 直接传 ISO 或 yyyy-mm-dd
  | { lastDays?: number }               // 最近 N 天
  | { lastMonths?: number }             // 最近 N 月
  | { lastYears?: number };             // 最近 N 年

export type SearchOptions = {
  // 核心
  keyword?: string;           // 普通关键字（空格分隔）
  phrase?: string[];          // 必须完整出现的短语（会加引号）
  mustInclude?: string[];     // 必须包含的词（不会加引号）
  mustExclude?: string[];     // 必须排除的词，会前置 -

  // 站点/范围
  site?: string | string[];   // site:example.com 或多个站点
  subdomainOnly?: boolean;    // true => 使用 site:*.example.com

  // 结构化过滤
  filetype?: string | string[]; // filetype:pdf，支持多个
  inurl?: string[];             // inurl:docs 等
  intitle?: string[];           // intitle:API 等

  // 语言/地区（Google 语法）
  language?: string;          // lr:lang_zh-CN / lang_en 等（Google 的 lr 值）
  country?: string;           // cr:countryCN / countryUS 等（Google 的 cr 值）

  // 时间范围
  time?: TimeRange;

  // OR 组合：任意一个命中
  anyOf?: string[];           // (a OR b OR c)

  // 额外原样拼接的片段（你已预先写好语法）
  extra?: string[] | string;

  // 清洗/安全
  normalizeSpace?: boolean;   // 是否规范空格（默认 true）
  dedupe?: boolean;           // 是否对词项去重（默认 true）
};

export function buildQuery(opts: SearchOptions): string {
  const o = withDefaults(opts);

  const parts: string[] = [];

  // 1) 核心关键字
  pushIf(parts, clean(o.keyword));

  // 2) 短语（加双引号）
  for (const p of o.phrase) pushIf(parts, quote(p));

  // 3) 必须包含的词
  for (const w of o.mustInclude) pushIf(parts, clean(w));

  // 4) 排除词（前置 -）
  for (const w of o.mustExclude) pushIf(parts, prefixed('-', w));

  // 5) 站点
  const sites = arr(o.site).map(s => s.trim()).filter(Boolean);
  for (const s of sites) {
    pushIf(parts, `site:${o.subdomainOnly ? subdomainOf(s) : s}`);
  }

  // 6) 文件类型
  for (const ft of arr(o.filetype)) pushIf(parts, `filetype:${ft}`);

  // 7) inurl / intitle
  for (const v of arr(o.inurl)) pushIf(parts, `inurl:${wrapIfSpace(v)}`);
  for (const v of arr(o.intitle)) pushIf(parts, `intitle:${wrapIfSpace(v)}`);

  // 8) 语言/地区（Google 专属）
  if (o.language) pushIf(parts, `lr:${normalizeLang(o.language)}`);
  if (o.country) pushIf(parts, `cr:${normalizeCountry(o.country)}`);

  // 9) 时间范围
  const timeExpr = toTimeExpr(o.time);
  if (timeExpr) pushIf(parts, timeExpr);

  // 10) OR 组合
  if (o.anyOf.length) {
    const orGroup = o.anyOf.map(safeToken).filter(Boolean).join(' OR ');
    if (orGroup) parts.push(`(${orGroup})`);
  }

  // 11) 额外片段
  const extraParts = arr(o.extra).map(s => s.trim()).filter(Boolean);
  parts.push(...extraParts);

  // 12) 合并/清洗
  let q = parts.filter(Boolean).join(' ');
  if (o.normalizeSpace) q = normalizeSpaces(q);
  return q.trim();
}

/**
 * 从环境变量构建 SearchOptions，方便 CLI 控制。
 * 约定：
 * - SEARCH_KEYWORD, SEARCH_PHRASE, SEARCH_INCLUDE, SEARCH_EXCLUDE
 * - SEARCH_SITE, SEARCH_FILETYPE, SEARCH_INURL, SEARCH_INTITLE
 * - SEARCH_LANGUAGE, SEARCH_COUNTRY
 * - SEARCH_AFTER, SEARCH_BEFORE, SEARCH_LAST_DAYS, SEARCH_LAST_MONTHS, SEARCH_LAST_YEARS
 * - SEARCH_ANYOF, SEARCH_EXTRA
 * 多值用逗号分隔。
 */
export function fromEnv(env = process.env): SearchOptions {
  const parseList = (v?: string) =>
    v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];

  const time = (
    env.SEARCH_LAST_DAYS || env.SEARCH_LAST_MONTHS || env.SEARCH_LAST_YEARS
  )
    ? {
        lastDays: env.SEARCH_LAST_DAYS ? +env.SEARCH_LAST_DAYS : undefined,
        lastMonths: env.SEARCH_LAST_MONTHS ? +env.SEARCH_LAST_MONTHS : undefined,
        lastYears: env.SEARCH_LAST_YEARS ? +env.SEARCH_LAST_YEARS : undefined
      }
    : {
        after: env.SEARCH_AFTER,
        before: env.SEARCH_BEFORE
      };

  return {
    keyword: env.SEARCH_KEYWORD,
    phrase: parseList(env.SEARCH_PHRASE),
    mustInclude: parseList(env.SEARCH_INCLUDE),
    mustExclude: parseList(env.SEARCH_EXCLUDE),
    site: parseList(env.SEARCH_SITE),
    subdomainOnly: env.SEARCH_SUBDOMAIN_ONLY === 'true',
    filetype: parseList(env.SEARCH_FILETYPE),
    inurl: parseList(env.SEARCH_INURL),
    intitle: parseList(env.SEARCH_INTITLE),
    language: env.SEARCH_LANGUAGE,
    country: env.SEARCH_COUNTRY,
    time,
    anyOf: parseList(env.SEARCH_ANYOF),
    extra: parseList(env.SEARCH_EXTRA),
    normalizeSpace: env.SEARCH_NORMALIZE_SPACE !== 'false',
    dedupe: env.SEARCH_DEDUPE !== 'false'
  };
}

/**
 * 便捷函数：env -> options -> query
 */
export function buildQueryFromEnv(env = process.env): string {
  const opts = fromEnv(env);
  return buildQuery(opts);
}

/* ========== 内部工具 ========== */

function withDefaults(o: SearchOptions): Required<SearchOptions> {
  return {
    keyword: o.keyword ?? '',
    phrase: arr(o.phrase),
    mustInclude: arr(o.mustInclude),
    mustExclude: arr(o.mustExclude),
    site: arr(o.site),
    subdomainOnly: !!o.subdomainOnly,
    filetype: arr(o.filetype),
    inurl: arr(o.inurl),
    intitle: arr(o.intitle),
    language: o.language ?? '',
    country: o.country ?? '',
    time: o.time ?? {},
    anyOf: arr(o.anyOf),
    extra: arr(o.extra),
    normalizeSpace: o.normalizeSpace ?? true,
    dedupe: o.dedupe ?? true
  };
}

function arr<T>(v?: T | T[]): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function pushIf(list: string[], token?: string) {
  if (!token) return;
  list.push(token);
}

function clean(s?: string): string | undefined {
  if (!s) return undefined;
  const x = s.replace(/\s+/g, ' ').trim();
  return x || undefined;
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function quote(s?: string): string | undefined {
  const t = clean(s);
  return t ? `"${t.replace(/"/g, '\\"')}"` : undefined;
}

function prefixed(prefix: string, s?: string): string | undefined {
  const t = clean(s);
  return t ? `${prefix}${wrapIfSpace(t)}` : undefined;
}

function wrapIfSpace(s: string): string {
  return /\s/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

function safeToken(s?: string): string {
  const t = clean(s);
  if (!t) return '';
  // 对包含空格或特殊字符的 token 加引号
  return /[\s:()"]/.test(t) ? `"${t.replace(/"/g, '\\"')}"` : t;
}

function subdomainOf(host: string): string {
  // 输入 example.com -> *.example.com；若已是 *.example.com 保持不变
  const h = host.trim();
  if (h.startsWith('*.')) return h;
  if (h.includes('*')) return h; // 用户自定义了通配
  return `*.${h.replace(/^\*\./, '')}`;
}

// Google lr 与 cr 可能需要特定格式，这里做宽容标准化
function normalizeLang(lang: string): string {
  const t = lang.trim();
  // 允许直接传 lr:lang_zh-CN，这里只接收后缀
  if (t.startsWith('lang_')) return t;
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(t)) return `lang_${t}`;
  return t;
}

function normalizeCountry(country: string): string {
  const t = country.trim();
  if (t.startsWith('country')) return t;
  // US -> countryUS, CN -> countryCN
  if (/^[A-Z]{2}$/.test(t)) return `country${t}`;
  return t;
}

function toTimeExpr(time?: TimeRange): string | undefined {
  if (!time) return undefined;

  // 最近 N 天/月/年
  if ('lastDays' in time && time.lastDays) return `after:${offsetDays(-time.lastDays)}`;
  if ('lastMonths' in time && time.lastMonths) return `after:${offsetMonths(-time.lastMonths)}`;
  if ('lastYears' in time && time.lastYears) return `after:${offsetYears(-time.lastYears)}`;

  // after/before 直接拼
  const a = (time as any).after as string | undefined;
  const b = (time as any).before as string | undefined;

  if (a && b) return `after:${normalizeDate(a)} before:${normalizeDate(b)}`;
  if (a) return `after:${normalizeDate(a)}`;
  if (b) return `before:${normalizeDate(b)}`;
  return undefined;
}

function normalizeDate(s: string): string {
  // 允许 yyyy, yyyy-mm, yyyy-mm-dd；其他原样返回
  const t = s.trim();
  if (/^\d{4}$/.test(t)) return `${t}-01-01`;
  if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return t;
}

function offsetDays(delta: number): string {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
function offsetMonths(delta: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + delta);
  return d.toISOString().slice(0, 10);
}
function offsetYears(delta: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + delta);
  return d.toISOString().slice(0, 10);
}