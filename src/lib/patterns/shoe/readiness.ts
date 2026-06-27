import type { EngineeringIssue, ProductionGate } from '../../../types/platform';
import type { ShoeLastMeasurements, ShoePatternInput, ShoeReadinessReport } from '../../../types/shoe';
import { validateShoeLastMesh } from './meshValidation';

const requiredMeasurements: (keyof ShoeLastMeasurements)[] = [
  'lengthMm',
  'ballWidthMm',
  'ballGirthMm',
  'instepGirthMm',
  'heelGirthMm',
  'heelHeightMm',
];

function issue(id: string, severity: EngineeringIssue['severity'], message: string, ruleIds: string[]): EngineeringIssue {
  return { id, severity, message, ruleIds };
}

export function assessShoeReadiness(input: ShoePatternInput): ShoeReadinessReport {
  const issues: EngineeringIssue[] = [];
  const missingLastMeasurements = requiredMeasurements.filter((key) => {
    const value = input.last.measurements[key];
    return typeof value !== 'number' || value <= 0;
  });

  if (!input.last.mesh) {
    issues.push(
      issue(
        'shoe-last-mesh-required',
        'error',
        'Для производственной обувной выкройки требуется цифровая 3D-модель конкретной колодки.',
        ['SH-001', 'SH-003'],
      ),
    );
  }

  if (input.last.mesh) {
    issues.push(...validateShoeLastMesh(input.last));
  }

  if (missingLastMeasurements.length > 0) {
    issues.push(
      issue(
        'shoe-last-measurements-incomplete',
        'error',
        `Не заполнены обязательные измерения колодки: ${missingLastMeasurements.join(', ')}.`,
        ['SH-001', 'SH-002'],
      ),
    );
  }

  if (!input.last.axisConfirmed || !input.last.landmarksConfirmed) {
    issues.push(
      issue(
        'shoe-last-reference-system',
        'error',
        'Не подтверждены ось, плоскость следа и контрольные точки колодки.',
        ['SH-003'],
      ),
    );
  }

  if (!input.physicalPrototypeId) {
    issues.push(
      issue(
        'shoe-prototype-required',
        'error',
        'Методика не может считаться производственной без собранного и затянутого физического прототипа.',
        ['SH-008'],
      ),
    );
  }

  if (!input.masterApprovalId) {
    issues.push(
      issue(
        'shoe-master-approval-required',
        'error',
        'Необходимо заключение обувного конструктора по базовой модели и контрольной паре.',
        ['SH-004', 'SH-006', 'SH-008'],
      ),
    );
  }

  const gates: ProductionGate[] = [
    { id: 'knowledge-reviewed', label: 'Методика и источники рассмотрены', passed: true, evidence: input.methodRevision },
    { id: 'input-complete', label: 'Колодка и параметры заполнены', passed: !issues.some((item) => item.id.startsWith('shoe-last-')) },
    { id: 'geometry-validated', label: '3D/2D развёртка проверена', passed: false },
    { id: 'assembly-validated', label: 'Сопряжения и сборка проверены', passed: false },
    { id: 'prototype-built', label: 'Физический прототип изготовлен', passed: Boolean(input.physicalPrototypeId), evidence: input.physicalPrototypeId },
    { id: 'master-approved', label: 'Обувной конструктор подтвердил результат', passed: Boolean(input.masterApprovalId), evidence: input.masterApprovalId },
  ];

  return {
    moduleId: 'shoe',
    canGeneratePreview:
      Boolean(input.last.mesh) &&
      missingLastMeasurements.length === 0 &&
      !issues.some((item) => item.id.startsWith('shoe-last-') || item.id.startsWith('shoe-mesh-')),
    canGenerateProductionPattern: gates.every((gate) => gate.passed),
    canClaimProfessionalUse: gates.every((gate) => gate.passed),
    issues,
    gates,
    missingLastMeasurements,
  };
}
