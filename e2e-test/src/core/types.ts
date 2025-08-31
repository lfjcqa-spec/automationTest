export enum CaseCategory {
  DataDriven = 'DataDriven',
  KeywordDriven = 'KeywordDriven',
}

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

export interface ParamKV {
  key: string;
  value: any;
}

export interface StepModel {
  id: number;
  ordinal: number;
  name: string;
  params: ParamKV[];
}

export interface DataSetModel {
  id: number | null;
  name: string;
  ordinal: number;
}

export interface CaseModel {
  id: number;
  name: string;
  category: CaseCategory;
  steps: StepModel[];
  dataSets: DataSetModel[];
}

export interface SuiteModel {
  id: number;
  name: string;
  cases: CaseModel[];
}

export interface RunUnit {
  suite: SuiteModel;
  testCase: CaseModel;
  dataSet: DataSetModel | null;
  step: StepModel;
  params: Record<string, any>;
}

// e2e-test/src/core/types.ts

// ...保留你现有的导出

export type SpDesignStep = {
  id: number;
  caseId: number;
  order: number;
  keyword: string;
  // 可选增强字段
  description?: string | null;
  params?: Record<string, string | number | boolean | null>;
};

export type SpDesignDataSet = {
  id: number;
  caseId: number;
  name: string;
  values: Record<string, string | number | boolean | null>;
};

export type SpDesignCase = {
  id: number;
  suiteId: number;
  suiteName: string;
  name: string;
  category: 'DataDriven' | 'KeywordDriven';
  description?: string | null;
  isActive?: boolean;
  steps: SpDesignStep[];
  dataSets?: SpDesignDataSet[];
};
