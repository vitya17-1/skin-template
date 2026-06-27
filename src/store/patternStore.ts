import { create } from 'zustand';
import { simpleWalletDefaults } from '../data/templates/walletTemplates';
import type { WalletPatternParams } from '../types/pattern';

type PatternStore = {
  params: WalletPatternParams;
  updateParam: <K extends keyof WalletPatternParams>(key: K, value: WalletPatternParams[K]) => void;
  applyTemplate: (params: WalletPatternParams) => void;
};

export const usePatternStore = create<PatternStore>((set) => ({
  params: simpleWalletDefaults,
  updateParam: (key, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [key]: value,
      },
    })),
  applyTemplate: (params) => set({ params }),
}));
