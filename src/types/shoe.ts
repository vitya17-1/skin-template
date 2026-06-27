import type { EngineeringIssue, ReadinessReport } from './platform';

export type ShoeLastMeshFormat = 'stl' | 'obj' | 'ply' | 'glb';

export type ShoeLastMeasurements = {
  lengthMm: number;
  ballWidthMm: number;
  ballGirthMm: number;
  instepGirthMm: number;
  heelGirthMm: number;
  heelHeightMm: number;
};

export type ShoeLastInput = {
  id: string;
  source: 'physical-measurements' | '3d-scan' | 'cad-model';
  mesh?: {
    fileName: string;
    format: ShoeLastMeshFormat;
    unit: 'mm';
  };
  meshInspection?: ShoeLastMeshInspection;
  measurements: Partial<ShoeLastMeasurements>;
  axisConfirmed: boolean;
  landmarksConfirmed: boolean;
};

export type ShoeLastMeshInspection = {
  vertexCount: number;
  triangleCount: number;
  boundsMm: { x: number; y: number; z: number };
  isClosed: boolean;
  isManifold: boolean;
  normalsValid: boolean;
};

export type ShoePatternInput = {
  model: 'derby-low';
  construction: 'cemented';
  sizeSystem: 'mondopoint' | 'eu';
  markedSize: number;
  upperLeatherThicknessMm: number;
  liningThicknessMm: number;
  stitchInsetMm: number;
  lastingAllowanceMm: number;
  eyeletCount: number;
  last: ShoeLastInput;
  methodRevision: string;
  masterApprovalId?: string;
  physicalPrototypeId?: string;
};

export type ShoeNormalizedInput = ShoePatternInput & {
  unit: 'mm';
  side: 'right';
};

export type ShoeFoundationGeometry = {
  status: 'blocked-until-method-validation';
  lastId: string;
  model: ShoePatternInput['model'];
  construction: ShoePatternInput['construction'];
  issues: EngineeringIssue[];
};

export type ShoeReadinessReport = ReadinessReport & {
  missingLastMeasurements: (keyof ShoeLastMeasurements)[];
};
