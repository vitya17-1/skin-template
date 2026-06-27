import type { BeltPatternInput, BeltReadinessReport } from '../../../types/belt';
import type { EngineeringIssue, ProductionGate } from '../../../types/platform';

function issue(id: string, message: string, ruleIds: string[]): EngineeringIssue {
  return { id, severity: 'error', message, ruleIds };
}

export function assessBeltReadiness(input: BeltPatternInput): BeltReadinessReport {
  const issues: EngineeringIssue[] = [];

  if (input.wearableCircumferenceMm <= 0) {
    issues.push(issue('belt-working-length', 'Нужна измеренная рабочая длина до центрального отверстия.', ['BL-001']));
  }
  if (input.strapWidthMm <= 0 || input.strapWidthMm > input.buckleInsideWidthMm) {
    issues.push(issue('belt-buckle-width', 'Ширина полосы не согласована с внутренней шириной пряжки.', ['BL-002']));
  }
  if (input.holeCount < 1 || input.holeCount % 2 === 0 || input.holePitchMm <= 0) {
    issues.push(issue('belt-hole-layout', 'Количество отверстий должно быть нечётным, а шаг положительным.', ['BL-003']));
  }
  if (!input.hardwareSampleId) {
    issues.push(issue('belt-hardware-sample', 'Не подтверждён образец конкретной пряжки и крепежа.', ['BL-004', 'BL-005']));
  }
  if (!input.physicalPrototypeId) {
    issues.push(issue('belt-prototype', 'Не изготовлен физический прототип ремня.', ['BL-005']));
  }
  if (!input.masterApprovalId) {
    issues.push(issue('belt-master-approval', 'Мастер не подтвердил конструкцию и посадку ремня.', ['BL-005']));
  }

  const gates: ProductionGate[] = [
    { id: 'knowledge-reviewed', label: 'Правила ремня рассмотрены', passed: true },
    { id: 'input-complete', label: 'Размеры и фурнитура заполнены', passed: !issues.some((item) => ['belt-working-length', 'belt-buckle-width', 'belt-hole-layout', 'belt-hardware-sample'].includes(item.id)) },
    { id: 'geometry-validated', label: 'Геометрия ремня проверена', passed: false },
    { id: 'assembly-validated', label: 'Пряжка, шлёвка и крепёж проверены', passed: Boolean(input.hardwareSampleId) },
    { id: 'prototype-built', label: 'Физический ремень изготовлен', passed: Boolean(input.physicalPrototypeId), evidence: input.physicalPrototypeId },
    { id: 'master-approved', label: 'Мастер подтвердил результат', passed: Boolean(input.masterApprovalId), evidence: input.masterApprovalId },
  ];

  return {
    moduleId: 'belt',
    canGeneratePreview: !issues.some((item) => ['belt-working-length', 'belt-buckle-width', 'belt-hole-layout'].includes(item.id)),
    canGenerateProductionPattern: gates.every((gate) => gate.passed),
    canClaimProfessionalUse: gates.every((gate) => gate.passed),
    issues,
    gates,
  };
}
