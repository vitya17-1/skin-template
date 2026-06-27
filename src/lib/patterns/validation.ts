import type { WalletPatternParams } from '../../types/pattern';

const pageFormatValues = ['auto', 'A4', 'A3', 'A2', 'A1', 'A0'];

export type WalletFieldKey =
  | 'widthMm'
  | 'heightMm'
  | 'pocketCount'
  | 'seamAllowanceMm'
  | 'cornerRadiusMm'
  | 'leatherThicknessMm'
  | 'printScale';

export type FieldRule = {
  key: WalletFieldKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  tooltip: string;
};

export const walletFieldRules: Record<WalletFieldKey, FieldRule> = {
  widthMm: {
    key: 'widthMm',
    label: 'Ширина в сложенном виде',
    unit: 'мм',
    min: 70,
    max: 140,
    step: 1,
    hint: 'Обычно 90-115 мм для компактных кошельков.',
    tooltip: 'Это размер закрытого кошелька по горизонтали. Развертка будет примерно в два раза шире.',
  },
  heightMm: {
    key: 'heightMm',
    label: 'Высота',
    unit: 'мм',
    min: 55,
    max: 110,
    step: 1,
    hint: 'Для карт обычно хватает 65-90 мм.',
    tooltip: 'Высота влияет на основную деталь и карманы. Добавьте запас под край и строчку.',
  },
  pocketCount: {
    key: 'pocketCount',
    label: 'Количество карманов',
    unit: 'шт',
    min: 1,
    max: 6,
    step: 1,
    hint: 'Для MVP доступно от 1 до 6 карманов.',
    tooltip: 'Карманы раскладываются на листе парами. Больше карманов увеличивает высоту выкройки на A4.',
  },
  seamAllowanceMm: {
    key: 'seamAllowanceMm',
    label: 'Припуск',
    unit: 'мм',
    min: 2,
    max: 8,
    step: 1,
    hint: 'Чаще всего 3-5 мм для ручной работы с кожей.',
    tooltip: 'Припуск добавляется к деталям и помогает оставить место под подрезку, клей или строчку.',
  },
  cornerRadiusMm: {
    key: 'cornerRadiusMm',
    label: 'Радиус скругления',
    unit: 'мм',
    min: 0,
    max: 14,
    step: 1,
    hint: '4-8 мм дают аккуратный мягкий угол.',
    tooltip: 'Радиус влияет на внешний вид детали и готового изделия, но не меняет базовые размеры.',
  },
  leatherThicknessMm: {
    key: 'leatherThicknessMm',
    label: 'Толщина кожи',
    unit: 'мм',
    min: 0.8,
    max: 3.5,
    step: 0.1,
    hint: 'Для кошельков обычно 1.2-2.0 мм.',
    tooltip: 'Толщина кожи влияет на ширину центрального сгиба: чем толще кожа, тем больше нужен корешок.',
  },
  printScale: {
    key: 'printScale',
    label: 'Масштаб печати',
    unit: '%',
    min: 50,
    max: 100,
    step: 1,
    hint: 'Для рабочей выкройки оставьте 100%.',
    tooltip: 'PDF строится 1:1. Если напечатать не на 100%, физические размеры будут неверными.',
  },
};

export function validateWalletParams(params: WalletPatternParams) {
  const numericErrors = Object.values(walletFieldRules).flatMap((rule) => {
    const value = params[rule.key];
    if (!Number.isFinite(value)) {
      return [`${rule.label}: введите число.`];
    }
    if (value < rule.min || value > rule.max) {
      return [`${rule.label}: допустимый диапазон ${rule.min}-${rule.max} ${rule.unit}.`];
    }
    if (rule.key === 'pocketCount' && !Number.isInteger(value)) {
      return ['Количество карманов должно быть целым числом.'];
    }
    return [];
  });

  if (!pageFormatValues.includes(params.pageFormat)) {
    return [...numericErrors, 'Формат листа: выберите Auto, A4, A3, A2, A1 или A0.'];
  }

  return numericErrors;
}
