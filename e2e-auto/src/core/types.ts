// 中文：域模型与数据库行类型定义（完全对齐你的大SQL）

export enum CaseCategory {
  DataDriven = 'DataDriven',
  KeywordDriven = 'KeywordDriven',
}

// 数据库行（用于逐表查询时的类型）
export interface DbSuite {
  Id: number;
  Name: string;
}
export interface DbCase {
  Id: number;
  Name: string;
  CategoryId: number;
  SuiteId: number | null;
}
export interface DbStep {
  Id: number;
  CaseId: number;
  Ordinal: number;
  StepName: string;
}
export interface DbParamDef {
  Id: number;
  StepId: number;
  ParamKey: string;
  ParamOrder: number;
}
export interface DbDataSet {
  Id: number;
  CaseId: number;
  Name: string | null;
  Ordinal: number;
}
export interface DbDDValue {
  Id: number;
  DataSetId: number;
  ParamKey: string;
  ParamValue: string | null;
  ValueType: string;
}
export interface DbKWValue {
  Id: number;
  CaseId: number;
  StepId: number;
  DataSetId: number | null;
  ParamKey: string;
  ParamValue: string | null;
  ValueType: string;
}

// 运行时模型
export interface ParamKV {
  key: string;
  value: any;
}

export interface StepModel {
  id: number; // StepId（SP 模式下为虚拟 Id，用于运行时标识）
  ordinal: number; // 步骤序号
  name: string; // 步骤名（StepName）
  params: ParamKV[]; // 步骤参数键集合（值会在执行前由 DataProvider 注入）
}

export interface DataSetModel {
  id: number | null; // DataSetId；KeywordDriven 没定义时为 null
  name: string; // DataSet 名称或 Default
  ordinal: number; // loop 序（来自 ds.Ordinal 或补1）
}

export interface CaseModel {
  id: number; // CaseId（SP 模式下为虚拟 Id）
  name: string; // Case 名称
  category: CaseCategory;
  steps: StepModel[];
  dataSets: DataSetModel[];
}

export interface SuiteModel {
  id: number; // SuiteId（SP 模式下为虚拟 Id）
  name: string; // Suite 名称
  cases: CaseModel[];
}

// DataProvider 生成的执行单元（step 级执行时临时结构）
export interface RunUnit {
  suite: SuiteModel;
  testCase: CaseModel;
  dataSet: DataSetModel | null;
  step: StepModel;
  params: Record<string, any>;
}

// 存储过程 sp_GetCasesDesignJson 输出结构（反序列化后用）
export interface SpDesignCase {
  category: 'DataDriven' | 'KeywordDriven';
  suiteName: string;
  caseName: string;
  loops: {
    loopIndex: number; // DataSet 序号（KeywordDriven 无 DataSet 时给默认 1）
    dataSetId: number | null; // DataSetId，KeywordDriven 无 DataSet 时为 null
    groupName: string; // DataSet 名称，或 'Default'
    steps: {
      stepName: string;
      params: Record<string, any>; // 已合并的参数键值（按存储过程逻辑）
    }[];
  }[];
}
