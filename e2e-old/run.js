// run.js (強化版：帶探針與詳盡錯誤提示)
"use strict";

function probe(msg) {
  process.stdout.write(`[probe] ${msg}\n`);
}

// 0) 你的原始數據（直接內嵌）
const suite1Json = [
  {
    caseName: "Suite1_Case1",
    loops: [
      {
        loopIndex: 1,
        steps: [
          { stepName: "step1", param1: "step1_param1_loop1", param2: "step1_param2_loop1" },
          { stepName: "step2", param1: "step2_param1_loop1", param2: "step2_param2_loop1" },
          { stepName: "step3", param1: "step3_param1_loop1", param2: "step3_param2_loop1" }
        ]
      },
      {
        loopIndex: 2,
        steps: [
          { stepName: "step1", param1: "step1_param1_loop2", param2: "step1_param2_loop2" },
          { stepName: "step2", param1: "step2_param1_loop2", param2: "step2_param2_loop2" },
          { stepName: "step3", param1: "step3_param1_loop2", param2: "step3_param2_loop2" }
        ]
      }
    ]
  }
];

const suite2Json = [
  {
    caseName: "Suite2_Case1",
    steps: [
      { stepName: "step1", param1: "case1_step1_param1", param2: "case1_step1_param2", param3: "case1_step1_param3" },
      { stepName: "step2", param1: "case1_step2_param1", param2: "case1_step2_param2", param3: "case1_step2_param3" },
      { stepName: "step3", param1: "case1_step3_param1", param2: "case1_step3_param2", param3: "case1_step3_param3" }
    ]
  },
  {
    caseName: "Suite2_Case2",
    steps: [
      { stepName: "step1", param1: "case2_step1_param1", param2: "case2_step1_param2" },
      { stepName: "step2", param1: "case2_step2_param1", param2: "case2_step2_param2" },
      { stepName: "step3", param1: "case2_step3_param1", param2: "case2_step3_param2" },
      { stepName: "step4", param1: "case2_step4_param1", param2: "case2_step4_param2" }
    ]
  }
];

// 1) Fixture → dataCtx
function createDataCtx(suite1Data, suite2Data) {
  probe("createDataCtx()");
  const idxSuite1 = new Map();
  suite1Data.forEach(c => idxSuite1.set(c.caseName, c));
  const idxSuite2 = new Map();
  suite2Data.forEach(c => idxSuite2.set(c.caseName, c));

  return {
    suite1: suite1Data,
    suite2: suite2Data,
    getCase(suiteName, caseName) {
      return suiteName === "TestSuite1" ? idxSuite1.get(caseName)
           : suiteName === "TestSuite2" ? idxSuite2.get(caseName)
           : undefined;
    },
    getLoop(loopCaseObj, loopIndex) {
      return loopCaseObj?.loops?.find(l => l.loopIndex === loopIndex);
    },
    getStep(stepsHolder, stepName) {
      return stepsHolder?.steps?.find(s => s.stepName === stepName);
    },
    getParams({ suite, caseName, stepName, loopIndex }) {
      if (suite === "TestSuite1") {
        const c = this.getCase("TestSuite1", caseName);
        if (!c) return [];
        const loop = this.getLoop(c, loopIndex);
        if (!loop) return [];
        const st = this.getStep(loop, stepName);
        return st ? [st.param1, st.param2, st.param3].filter(Boolean) : [];
      }
      if (suite === "TestSuite2") {
        const c = this.getCase("TestSuite2", caseName);
        if (!c) return [];
        const st = this.getStep(c, stepName);
        return st ? [st.param1, st.param2, st.param3].filter(Boolean) : [];
      }
      return [];
    }
  };
}

// 2) 測試級 dataCtx
function createTestCtx(dataCtx, suite, caseName, loopIndex /* optional */) {
  probe(`createTestCtx(${suite}, ${caseName}${suite==="TestSuite1"?`, loop=${loopIndex}`:""})`);
  if (suite === "TestSuite1") {
    const caseData = dataCtx.getCase("TestSuite1", caseName);
    if (!caseData) throw new Error(`Case not found: ${suite}/${caseName}`);
    if (typeof loopIndex !== "number") throw new Error(`loopIndex required for ${suite}/${caseName}`);
    const loop = dataCtx.getLoop(caseData, loopIndex);
    if (!loop) throw new Error(`Loop not found: ${suite}/${caseName}/loop=${loopIndex}`);
    const indexByStepName = new Map(loop.steps.map(s => [s.stepName, s]));
    return { suite, caseName, loopIndex, indexByStepName };
  }
  if (suite === "TestSuite2") {
    const caseData = dataCtx.getCase("TestSuite2", caseName);
    if (!caseData) throw new Error(`Case not found: ${suite}/${caseName}`);
    const indexByStepName = new Map(caseData.steps.map(s => [s.stepName, s]));
    return { suite, caseName, indexByStepName };
  }
  throw new Error(`Unknown suite: ${suite}`);
}

// 3) 步驟級 dataCtx（StepFixture）
function getStepParams(testCtx, stepName) {
  const step = testCtx.indexByStepName.get(stepName);
  return step ? [step.param1, step.param2, step.param3].filter(Boolean) : [];
}

// 小工具
function log(s) { process.stdout.write(s + "\n"); }
function pad(n) { return " ".repeat(n); }

// 步驟序
const stepsOrderSuite1 = ["step1", "step2", "step3"];
const stepsOrderSuite2_case1 = ["step1", "step2", "step3"];
const stepsOrderSuite2_case2 = ["step1", "step2", "step3", "step4"];

// 4) Step Runner
function runSuite_TestSuite1(dataCtx) {
  const suiteName = "TestSuite1";
  log(`${suiteName}`);
  log(`${pad(2)}pre：suite`);

  const caseName = "Suite1_Case1";
  for (const loopIndex of [1, 2]) {
    log(`${pad(2)}TestCase: ${caseName}_loop${loopIndex}`);
    log(`${pad(4)}pre：test`);

    const testCtx = createTestCtx(dataCtx, suiteName, caseName, loopIndex);

    for (const stepName of stepsOrderSuite1) {
      log(`${pad(6)}${stepName}    pre：step`);
      const params = getStepParams(testCtx, stepName);
      if (params.length) log(`${pad(13)}${params.join("    ")}`);
      log(`${pad(13)}after：step`);
    }
    log(`${pad(4)}after：test`);
  }

  log(`${pad(2)}after：suite`);
  log("");
}

function runSuite_TestSuite2(dataCtx) {
  const suiteName = "TestSuite2";
  log(`${suiteName}`);
  log(`${pad(2)}pre：suite`);

  // Case1
  let caseName = "Suite2_Case1";
  log(`${pad(2)}TestCase: ${caseName}`);
  log(`${pad(4)}pre：test`);
  let testCtx = createTestCtx(dataCtx, suiteName, caseName);
  for (const stepName of stepsOrderSuite2_case1) {
    log(`${pad(6)}${stepName}    pre：step`);
    const params = getStepParams(testCtx, stepName);
    if (params.length) log(`${pad(13)}${params.join("    ")}`);
    log(`${pad(13)}after：step`);
  }
  log(`${pad(4)}after：test`);

  // Case2
  caseName = "Suite2_Case2";
  log(`${pad(2)}TestCase: ${caseName}`);
  log(`${pad(4)}pre：test`);
  testCtx = createTestCtx(dataCtx, suiteName, caseName);
  for (const stepName of stepsOrderSuite2_case2) {
    log(`${pad(6)}${stepName}    pre：step`);
    const params = getStepParams(testCtx, stepName);
    if (params.length) log(`${pad(13)}${params.join("    ")}`);
    log(`${pad(13)}after：step`);
  }
  log(`${pad(4)}after：test`);

  log(`${pad(2)}after：suite`);
  log("");
}

// 5) main
function main() {
  try {
    probe("BOOT");
    const dataCtx = createDataCtx(suite1Json, suite2Json);
    runSuite_TestSuite1(dataCtx);
    runSuite_TestSuite2(dataCtx);
    probe("DONE");
  } catch (err) {
    console.error("[error]", err && err.stack || err);
    process.exitCode = 1;
  }
}

main();