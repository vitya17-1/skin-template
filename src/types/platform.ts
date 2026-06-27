export type ProductModuleId = 'cardholder' | 'belt' | 'shoe';

export type ProductionReadiness =
  | 'research'
  | 'prototype-required'
  | 'master-validated'
  | 'production-ready';

export type EngineeringConfidence =
  | 'source-backed'
  | 'engineering-derived'
  | 'needs-master-validation'
  | 'physical-prototype-required';

export type ModuleCapability =
  | 'parameter-input'
  | 'geometry-2d'
  | 'last-3d-input'
  | 'surface-flattening'
  | 'assembly-validation'
  | 'layout'
  | 'pdf'
  | 'svg'
  | 'dxf';

export type ProductionGateId =
  | 'knowledge-reviewed'
  | 'input-complete'
  | 'geometry-validated'
  | 'assembly-validated'
  | 'prototype-built'
  | 'master-approved';

export type ProductionGate = {
  id: ProductionGateId;
  label: string;
  passed: boolean;
  evidence?: string;
};

export type ProductModuleDescriptor = {
  id: ProductModuleId;
  name: string;
  version: string;
  readiness: ProductionReadiness;
  summary: string;
  capabilities: ModuleCapability[];
  gates: ProductionGate[];
};

export type EngineeringIssue = {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleIds: string[];
};

export type ReadinessReport = {
  moduleId: ProductModuleId;
  canGeneratePreview: boolean;
  canGenerateProductionPattern: boolean;
  canClaimProfessionalUse: boolean;
  issues: EngineeringIssue[];
  gates: ProductionGate[];
};

export interface ProductPatternModule<TInput, TNormalized, TGeometry> {
  descriptor: ProductModuleDescriptor;
  normalize(input: TInput): TNormalized;
  validateInput(input: TNormalized): EngineeringIssue[];
  deriveGeometry(input: TNormalized): TGeometry;
  validateGeometry(geometry: TGeometry): EngineeringIssue[];
  readiness(input: TInput): ReadinessReport;
}
