import type { ReadinessReport } from './platform';

export type BeltPatternInput = {
  wearableCircumferenceMm: number;
  strapWidthMm: number;
  leatherThicknessMm: number;
  buckleInsideWidthMm: number;
  buckleBarToTongueMm: number;
  buckleFoldAllowanceMm: number;
  tailLengthMm: number;
  holeCount: number;
  holePitchMm: number;
  tongueHoleDiameterMm: number;
  keeperInsideLengthMm: number;
  keeperOverlapMm: number;
  hardwareSampleId?: string;
  physicalPrototypeId?: string;
  masterApprovalId?: string;
};

export type BeltReadinessReport = ReadinessReport;

export type BeltPoint = { x: number; y: number };

export type BeltGeometry = {
  unit: 'mm';
  status: 'prototype-required';
  strap: {
    lengthMm: number;
    widthMm: number;
    centerHoleX: number;
    foldLineX: number;
    tongueSlotCenterX: number;
  };
  adjustmentHoles: BeltPoint[];
  keeper: {
    cutLengthMm: number;
    widthMm: number;
  };
  validation: {
    isValid: boolean;
    issues: { id: string; message: string; ruleIds: string[] }[];
  };
};
