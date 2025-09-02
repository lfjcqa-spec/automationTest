// src/wrappers/types.ts
export interface StepResult {
  stepName: string;
  status: 'passed' | 'failed';
  error?: string;
}
