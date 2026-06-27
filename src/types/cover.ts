export type CoverProductType = 'passport' | 'a5-notebook' | 'a4-document' | 'custom';

export type CoverPatternInput = {
  productType: CoverProductType;
  docWidthMm: number;
  docHeightMm: number;
  spineWidthMm: number;
  seamAllowanceMm: number;
  cornerRadiusMm: number;
  leatherThicknessMm: number;
  hasInnerLining: boolean;
  hasCardSlots: boolean;
  cardSlotCount: number;
};

export type CoverPiece = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  label: string;
  foldLines: { x: number }[];
};

export type CoverGeometry = {
  unit: 'mm';
  status: 'prototype-required';
  pieces: CoverPiece[];
  totalWidth: number;
  totalHeight: number;
  validation: {
    isValid: boolean;
    issues: { id: string; message: string }[];
  };
  assemblyNotes: string[];
};
