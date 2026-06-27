import type { ProductModuleDescriptor } from '../../types/platform';

export const productModuleRegistry: ProductModuleDescriptor[] = [
  {
    id: 'cardholder',
    name: 'Кардхолдер',
    version: '1.0.0-poc',
    readiness: 'prototype-required',
    summary: 'Параметрическая 2D-геометрия работает, но профессиональный статус требует контрольного изделия и заключения мастера.',
    capabilities: ['parameter-input', 'geometry-2d', 'layout', 'pdf'],
    gates: [
      { id: 'knowledge-reviewed', label: 'Knowledge Base создана', passed: true },
      { id: 'input-complete', label: 'Входные параметры валидируются', passed: true },
      { id: 'geometry-validated', label: 'Автоматические проверки геометрии', passed: true },
      { id: 'assembly-validated', label: 'Сборка проверена мастером', passed: false },
      { id: 'prototype-built', label: 'Контрольный прототип изготовлен', passed: false },
      { id: 'master-approved', label: 'Мастер утвердил методику', passed: false },
    ],
  },
  {
    id: 'belt',
    name: 'Ремень',
    version: '0.1.0-foundation',
    readiness: 'research',
    summary: 'Контракты и правила готовы для наполнения; производственная геометрия ещё не реализована.',
    capabilities: ['parameter-input'],
    gates: [
      { id: 'knowledge-reviewed', label: 'Базовые источники собраны', passed: true },
      { id: 'input-complete', label: 'Контракт параметров создан', passed: true },
      { id: 'geometry-validated', label: 'Геометрия реализована и проверена', passed: false },
      { id: 'assembly-validated', label: 'Фурнитура и сборка проверены', passed: false },
      { id: 'prototype-built', label: 'Контрольный ремень изготовлен', passed: false },
      { id: 'master-approved', label: 'Мастер утвердил методику', passed: false },
    ],
  },
  {
    id: 'shoe',
    name: 'Обувь',
    version: '0.1.0-foundation',
    readiness: 'research',
    summary: 'Определены требования к цифровой колодке, 3D/2D развёртке и физической приёмке.',
    capabilities: ['parameter-input', 'last-3d-input'],
    gates: [
      { id: 'knowledge-reviewed', label: 'Стандарты и исследования собраны', passed: true },
      { id: 'input-complete', label: 'Контракт цифровой колодки создан', passed: true },
      { id: 'geometry-validated', label: 'Flattening реализован и проверен', passed: false },
      { id: 'assembly-validated', label: 'Сопряжения деталей проверены', passed: false },
      { id: 'prototype-built', label: 'Контрольная пара изготовлена', passed: false },
      { id: 'master-approved', label: 'Обувной конструктор утвердил методику', passed: false },
    ],
  },
];

export function getProductModuleDescriptor(id: ProductModuleDescriptor['id']) {
  const descriptor = productModuleRegistry.find((item) => item.id === id);
  if (!descriptor) throw new Error(`Не зарегистрирован модуль изделия: ${id}`);
  return descriptor;
}
