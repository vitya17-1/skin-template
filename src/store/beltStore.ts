import { create } from 'zustand';
import type { BeltPatternInput } from '../types/belt';

export const beltDefaults: BeltPatternInput = {
  wearableCircumferenceMm: 850,
  strapWidthMm: 35,
  leatherThicknessMm: 3.5,
  buckleInsideWidthMm: 36,
  buckleBarToTongueMm: 15,
  buckleFoldAllowanceMm: 80,
  tailLengthMm: 150,
  holeCount: 5,
  holePitchMm: 25,
  tongueHoleDiameterMm: 8,
  keeperInsideLengthMm: 45,
  keeperOverlapMm: 25,
};

type BeltStore = {
  params: BeltPatternInput;
  updateParam: <K extends keyof BeltPatternInput>(key: K, value: BeltPatternInput[K]) => void;
  reset: () => void;
};

export const useBeltStore = create<BeltStore>((set) => ({
  params: beltDefaults,
  updateParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
  reset: () => set({ params: beltDefaults }),
}));
