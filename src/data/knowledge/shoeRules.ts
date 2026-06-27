import type { EngineeringConfidence } from '../../types/platform';

export type ShoeKnowledgeRule = {
  id: string;
  name: string;
  description: string;
  formula: string;
  confidence: EngineeringConfidence;
  sourceRefs: string[];
  automation: 'ready' | 'input-required' | 'method-validation-required' | 'prototype-required';
};

export const shoeSources = {
  isoLastMeasurement: 'https://www.iso.org/standard/81028.html',
  isoSizeConversion: 'https://www.iso.org/standard/83106.html',
  isoSizingVocabulary: 'https://www.iso.org/standard/83107.html',
  digitizingLast: 'https://doi.org/10.32508/stdj.v8i6.3006',
  surfaceFlattening: 'https://www.researchgate.net/publication/264135133_A_Study_on_Surface_Flattening_for_3_Dimensional_Shoe_Pattern_Design',
  surfaceDevelopment: 'https://www.researchgate.net/publication/228697450_A_Surface_Development_Method_with_Application_in_Footwear_CADCAM',
} as const;

export const shoeRules: ShoeKnowledgeRule[] = [
  {
    id: 'SH-001',
    name: 'Колодка является обязательным геометрическим основанием',
    description:
      'Профессиональная выкройка верха строится относительно конкретной колодки. Размеры стопы не заменяют геометрию колодки.',
    formula: 'shoePattern = f(lastSurface, construction, material, designLines)',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.isoLastMeasurement, shoeSources.digitizingLast],
    automation: 'input-required',
  },
  {
    id: 'SH-002',
    name: 'Измерения колодки отличаются от анатомических измерений стопы',
    description:
      'Маркировка размера и измерения стопы не должны напрямую использоваться как координаты колодки.',
    formula: 'lastDimensions != anatomicalFootLandmarks',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.isoLastMeasurement, shoeSources.isoSizeConversion],
    automation: 'ready',
  },
  {
    id: 'SH-003',
    name: 'Колодка должна иметь единую систему координат',
    description:
      'Перед построением необходимо подтвердить единицы, продольную ось, плоскость следа и контрольные ориентиры.',
    formula: 'normalizedLast = align(mesh, longitudinalAxis, bottomPlane, landmarks)',
    confidence: 'engineering-derived',
    sourceRefs: [shoeSources.isoLastMeasurement, shoeSources.digitizingLast],
    automation: 'input-required',
  },
  {
    id: 'SH-004',
    name: 'Развёртка поверхности является оптимизационной задачей',
    description:
      'Переход 3D поверхности верха в 2D должен минимизировать геометрическую ошибку и сохранять выбранные контрольные длины.',
    formula: 'minimize(flatteningDistortion) subject to seamLength and landmark constraints',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.surfaceFlattening, shoeSources.surfaceDevelopment],
    automation: 'method-validation-required',
  },
  {
    id: 'SH-005',
    name: 'Материал влияет на развёртку',
    description:
      'Кожа и подкладка имеют направленные свойства; деформацию нельзя оценивать как одинаковую во всех направлениях.',
    formula: 'strainEnergy = f(meshTriangles, materialWarp, materialWeft, thickness)',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.surfaceDevelopment],
    automation: 'method-validation-required',
  },
  {
    id: 'SH-006',
    name: 'Разрезы и линии модели являются частью конструкции',
    description:
      'Границы деталей не выводятся только из формы колодки: они задаются моделью и технологией сборки.',
    formula: 'pieceBoundaries = designCurves + constructionSeams + lastingBoundary',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.surfaceDevelopment],
    automation: 'input-required',
  },
  {
    id: 'SH-007',
    name: 'Размерная конверсия не является grading-алгоритмом',
    description:
      'Таблица соответствия размеров служит маркировке. Геометрическое масштабирование колодки требует отдельной методики grading.',
    formula: 'markedSizeConversion != lastGeometryGrading',
    confidence: 'source-backed',
    sourceRefs: [shoeSources.isoSizeConversion, shoeSources.isoSizingVocabulary],
    automation: 'ready',
  },
  {
    id: 'SH-008',
    name: 'Производственная пригодность подтверждается физическим прототипом',
    description:
      'До сборки и затяжки пробного верха нельзя гарантировать посадку, сопряжения и достаточность технологических припусков.',
    formula: 'productionReady = geometryValid && prototypeBuilt && masterApproved',
    confidence: 'physical-prototype-required',
    sourceRefs: [shoeSources.surfaceDevelopment],
    automation: 'prototype-required',
  },
  {
    id: 'SH-009',
    name: 'Масштаб mesh сверяется с физическим измерением колодки',
    description:
      'Габарит цифровой модели по продольной оси должен совпадать с измеренной длиной колодки в пределах установленного допуска импорта.',
    formula: 'abs(meshLongitudinalBounds - measuredLastLength) <= importTolerance',
    confidence: 'engineering-derived',
    sourceRefs: [shoeSources.isoLastMeasurement, shoeSources.digitizingLast],
    automation: 'ready',
  },
];

export function getShoeRule(id: string) {
  const rule = shoeRules.find((item) => item.id === id);
  if (!rule) throw new Error(`Не найдено обувное инженерное правило ${id}`);
  return rule;
}
