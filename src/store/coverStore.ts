import { create } from 'zustand';
import type { CoverPatternInput } from '../types/cover';

export const passportCoverDefaults: CoverPatternInput = {
  productType: 'passport',
  docWidthMm: 88,
  docHeightMm: 125,
  spineWidthMm: 5,
  seamAllowanceMm: 5,
  cornerRadiusMm: 6,
  leatherThicknessMm: 1.2,
  hasInnerLining: true,
  hasCardSlots: true,
  cardSlotCount: 2,
};

export const coverPresets: Record<string, CoverPatternInput> = {
  passport: passportCoverDefaults,
  'a5-notebook': {
    productType: 'a5-notebook',
    docWidthMm: 148,
    docHeightMm: 210,
    spineWidthMm: 12,
    seamAllowanceMm: 6,
    cornerRadiusMm: 8,
    leatherThicknessMm: 1.4,
    hasInnerLining: true,
    hasCardSlots: false,
    cardSlotCount: 0,
  },
  'a4-document': {
    productType: 'a4-document',
    docWidthMm: 210,
    docHeightMm: 297,
    spineWidthMm: 8,
    seamAllowanceMm: 8,
    cornerRadiusMm: 10,
    leatherThicknessMm: 1.6,
    hasInnerLining: false,
    hasCardSlots: false,
    cardSlotCount: 0,
  },
};

type CoverStore = {
  params: CoverPatternInput;
  updateParam: <K extends keyof CoverPatternInput>(key: K, value: CoverPatternInput[K]) => void;
  applyPreset: (preset: CoverPatternInput) => void;
};

export const useCoverStore = create<CoverStore>((set) => ({
  params: passportCoverDefaults,
  updateParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
  applyPreset: (preset) => set({ params: preset }),
}));
