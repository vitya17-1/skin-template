import type { WalletPatternParams, WalletTemplate } from '../../types/pattern';

export const simpleWalletDefaults: WalletPatternParams = {
  productType: 'wallet',
  templateId: 'classic-bifold',
  widthMm: 110,
  heightMm: 85,
  pocketCount: 2,
  seamAllowanceMm: 4,
  cornerRadiusMm: 6,
  leatherThicknessMm: 1.6,
  printScale: 100,
  pageFormat: 'auto',
};

export const walletTemplates: WalletTemplate[] = [
  {
    id: 'minimal-wallet',
    name: 'Мини-кардхолдер',
    description: 'Компактная учебная конфигурация с минимальным количеством деталей.',
    bestFor: 'лучше для старта',
    params: {
      ...simpleWalletDefaults,
      templateId: 'minimal-wallet',
      widthMm: 92,
      heightMm: 68,
      pocketCount: 1,
      seamAllowanceMm: 3,
      cornerRadiusMm: 5,
      leatherThicknessMm: 1.2,
    },
  },
  {
    id: 'classic-bifold',
    name: 'Складной кардхолдер',
    description: 'Базовая проверяемая конструкция: основа и два внутренних кармана.',
    bestFor: 'рекомендуем',
    params: {
      ...simpleWalletDefaults,
      templateId: 'classic-bifold',
    },
  },
  {
    id: 'card-wallet',
    name: 'Кардхолдер на 4 карты',
    description: 'Многослойный вариант, который пока требует отдельной физической приёмки.',
    bestFor: '4-6 карт',
    params: {
      ...simpleWalletDefaults,
      templateId: 'card-wallet',
      widthMm: 98,
      heightMm: 74,
      pocketCount: 4,
      seamAllowanceMm: 3,
      cornerRadiusMm: 4,
      leatherThicknessMm: 1.3,
    },
  },
  {
    id: 'long-wallet',
    name: 'Длинный кошелек',
    description: 'Широкий вариант для банкнот. Может не поместиться на один A4.',
    bestFor: 'для проверки лимитов',
    params: {
      ...simpleWalletDefaults,
      templateId: 'long-wallet',
      widthMm: 135,
      heightMm: 95,
      pocketCount: 4,
      seamAllowanceMm: 4,
      cornerRadiusMm: 8,
      leatherThicknessMm: 1.5,
    },
  },
];
