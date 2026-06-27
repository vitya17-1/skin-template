import type { EngineeringConfidence } from '../../types/platform';

export type BeltKnowledgeRule = {
  id: string;
  name: string;
  description: string;
  formula: string;
  confidence: EngineeringConfidence;
  sourceRefs: string[];
};

export const beltSources = {
  weaverBeltMaking: 'https://www.weaverleathersupply.com/pages/belt-making',
  weaverSizing: 'https://www.weaverleathersupply.com/blogs/leathercrafting/the-leather-element-what-size-should-i-make-my-belt',
  weaverConstruction: 'https://www.weaverleathersupply.com/blogs/leathercrafting/the-leather-element-all-about-belts-part-1',
  weaverBuckle: 'https://www.weaverleathersupply.com/products/50-buckle',
} as const;

export const beltRules: BeltKnowledgeRule[] = [
  {
    id: 'BL-001',
    name: 'Рабочая длина задаётся телом или подходящим ремнём',
    description: 'Маркировка размера одежды не является достаточным измерением рабочей длины ремня.',
    formula: 'centerHolePosition = wearableCircumference',
    confidence: 'source-backed',
    sourceRefs: [beltSources.weaverSizing, beltSources.weaverConstruction],
  },
  {
    id: 'BL-002',
    name: 'Ширина ремня согласуется с пряжкой',
    description: 'Внутренняя ширина пряжки задаёт совместимую ширину ременной полосы.',
    formula: 'strapWidth <= buckleInsideWidth - clearance',
    confidence: 'source-backed',
    sourceRefs: [beltSources.weaverBuckle],
  },
  {
    id: 'BL-003',
    name: 'Положение отверстий строится относительно центрального размера',
    description: 'Центральное отверстие соответствует рабочей длине; остальные отверстия размещаются симметрично с выбранным шагом.',
    formula: 'hole[i] = centerHole + (i - floor(holeCount / 2)) * holePitch',
    confidence: 'engineering-derived',
    sourceRefs: [beltSources.weaverBeltMaking, beltSources.weaverSizing],
  },
  {
    id: 'BL-004',
    name: 'Геометрия крепления зависит от конкретной пряжки',
    description: 'Положение сгиба, прорези язычка и крепежа нельзя определить только по ширине ремня.',
    formula: 'buckleEnd = f(barToTongue, foldAllowance, fastenerType, leatherThickness)',
    confidence: 'needs-master-validation',
    sourceRefs: [beltSources.weaverConstruction, beltSources.weaverBuckle],
  },
  {
    id: 'BL-005',
    name: 'Профессиональный модуль требует образец фурнитуры и прототип',
    description: 'До проверки конкретной пряжки, шлёвки и готового ремня нельзя гарантировать сборку.',
    formula: 'productionReady = hardwareVerified && prototypeBuilt && masterApproved',
    confidence: 'physical-prototype-required',
    sourceRefs: [beltSources.weaverConstruction],
  },
];
