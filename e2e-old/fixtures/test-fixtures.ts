import { test as base, expect as baseExpect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export type Vars = Record<string, any>;
export type Row = Record<string, any>;

type Fixtures = {
  vars: Vars;       // test-level：单条测试的共享变量
  dataRows: Row[];  // test-level：该测试加载的数据行
  dataFile: string; // test-level：当前测试所用的数据文件路径
};

function loadJsonRows(relOrAbs: string): Row[] {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(process.cwd(), relOrAbs);
  if (!fs.existsSync(p)) {
    console.warn(`[test-level][dataRows] 文件不存在: ${p}`);
    return [];
  }
  const raw = fs.readFileSync(p, 'utf-8');
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as Row[];
    console.warn(`[test-level][dataRows] 非数组 JSON: ${p}`);
    return [];
  } catch (e) {
    console.error(`[test-level][dataRows] 解析失败: ${p}`, e);
    return [];
  }
}

export const test = base.extend<Fixtures>({
  vars: async ({}, use, testInfo) => {
    const box: Vars = {};
    console.log(`[test-level][vars:init] ${testInfo.title}`);
    await use(box);
    console.log(`[test-level][vars:dispose] ${testInfo.title}`);
  },

  dataFile: [async ({}, use, testInfo) => {
    // 默认数据文件：tests/suites/<dir>/<file>_data.json（可在具体 suite 里 test.use 覆盖）
    const guess = testInfo.titlePath.join(' ').toLowerCase().includes('suite1')
      ? 'tests/suites/suite1/suite1_data.json'
      : 'tests/suites/suite2/suite2_data.json';
    await use(guess);
  }, { option: true }],

  dataRows: async ({ dataFile }, use) => {
    const rows = dataFile ? loadJsonRows(dataFile) : [];
    console.log(`[test-level][dataRows:loaded] file=${dataFile} rows=${rows.length}`);
    await use(rows);
  }
});

export const expect = baseExpect;