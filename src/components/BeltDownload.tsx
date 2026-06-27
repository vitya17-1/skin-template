import { useEffect, useState } from 'react';
import { Check, Download, ExternalLink, FileText, FlaskConical } from 'lucide-react';
import { createBeltPdfBlobAsync } from '../lib/pdf/generateBeltPdf';
import type { BeltGeometry, BeltPatternInput } from '../types/belt';

type BeltDownloadProps = {
  geometry: BeltGeometry;
  params: BeltPatternInput;
};

function generateBeltSpec(params: BeltPatternInput, geometry: BeltGeometry): string {
  const centerIdx = Math.floor(geometry.adjustmentHoles.length / 2);
  const lines = [
    'РЕМЕНЬ — ПРОИЗВОДСТВЕННАЯ СПЕЦИФИКАЦИЯ',
    '======================================',
    '',
    `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    '--- ПАРАМЕТРЫ ИЗДЕЛИЯ ---',
    `Ширина ремня:           ${params.strapWidthMm} мм`,
    `Толщина кожи:           ${params.leatherThicknessMm} мм`,
    `Обхват (рабочая длина): ${params.wearableCircumferenceMm} мм`,
    `Длина хвостовика:       ${params.tailLengthMm} мм`,
    '',
    '--- ПРЯЖКА ---',
    `Вн. ширина пряжки:      ${params.buckleInsideWidthMm} мм`,
    `Стержень → язычок:      ${params.buckleBarToTongueMm} мм`,
    `Припуск сгиба:          ${params.buckleFoldAllowanceMm} мм`,
    '',
    '--- ОТВЕРСТИЯ ---',
    `Количество:             ${params.holeCount} шт. (нечётное)`,
    `Шаг:                    ${params.holePitchMm} мм`,
    `Диаметр:                ${params.tongueHoleDiameterMm} мм`,
    '',
    '--- РАСЧЁТНАЯ ГЕОМЕТРИЯ ---',
    `Общая длина полосы:     ${Math.round(geometry.strap.lengthMm)} мм`,
    `Линия сгиба у пряжки:   ${Math.round(geometry.strap.foldLineX)} мм от края`,
    `Центральное отверстие:  ${Math.round(geometry.strap.centerHoleX)} мм от края`,
    `Прорезь язычка:         ${Math.round(geometry.strap.tongueSlotCenterX)} мм от края`,
    '',
    '--- ШЛЁВКА ---',
    `Ширина:                 ${geometry.keeper.widthMm} мм`,
    `Длина кроя:             ${Math.round(geometry.keeper.cutLengthMm)} мм`,
    `(Вн. длина + перехлёст: ${params.keeperInsideLengthMm} + ${params.keeperOverlapMm} = ${params.keeperInsideLengthMm + params.keeperOverlapMm} мм)`,
    '',
    '--- ПОЗИЦИИ ОТВЕРСТИЙ (от края) ---',
    ...geometry.adjustmentHoles.map((h, i) => {
      const isCenter = i === centerIdx;
      return `  Отверстие ${i + 1}: ${Math.round(h.x)} мм${isCenter ? ' ← ЦЕНТРАЛЬНОЕ (рабочий размер)' : ''}`;
    }),
    '',
    '--- СТАТУС ---',
    'Прототип обязателен: фурнитура и сборка должны быть проверены мастером.',
    '',
    'Правила: BL-001, BL-002, BL-003, BL-004, BL-005',
  ];
  return lines.join('\n');
}

export function BeltDownload({ geometry, params }: BeltDownloadProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const strapPages = Math.ceil(geometry.strap.lengthMm / (297 - 24));
  const totalPages = 1 + strapPages + 1;

  const checks = [
    { label: `PDF 1:1 · ${totalPages} стр. (спека + полоса + шлёвка)`, complete: true },
    { label: 'Контрольная линейка 10 см на каждом листе', complete: true },
    { label: 'Метки совмещения для склейки листов', complete: strapPages > 1 },
    { label: 'Позиции всех отверстий подписаны', complete: true },
    { label: 'Шлёвка в масштабе 1:1 на отдельном листе', complete: true },
  ];

  useEffect(() => {
    let url: string | null = null;
    setPdfLoading(true);
    createBeltPdfBlobAsync(params, geometry).then((blob) => {
      url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfLoading(false);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [params, geometry]);

  const downloadSpec = () => {
    const content = generateBeltSpec(params, geometry);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `belt-spec-${params.wearableCircumferenceMm}mm.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-xl border border-black/10 bg-ink p-5 text-white shadow-soft">
      <div className="flex items-start gap-3">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/12">
          <FileText size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">Экспорт · Ремень</p>
          <h2 className="mt-1 text-xl font-semibold">Производственная документация</h2>
          <p className="mt-2 text-sm leading-6 text-white/72">
            PDF в масштабе 1:1 с разбивкой на листы A4. Распечатайте, проверьте линейку и склейте листы по меткам совмещения.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-5 rounded-md border border-white/12 bg-white/8 p-3">
        <p className="mb-2 text-sm font-semibold">Состав PDF</p>
        <div className="grid gap-2 text-sm text-white/78">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${c.complete ? 'bg-mint text-ink' : 'bg-white/15 text-white/45'}`}>
                <Check size={13} />
              </span>
              <span className="text-xs">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Specs summary */}
      <div className="mt-3 rounded-md border border-white/10 bg-white/6 p-3 text-xs text-white/70 grid grid-cols-2 gap-1.5">
        <span>Длина полосы: <strong className="text-white">{Math.round(geometry.strap.lengthMm)} мм</strong></span>
        <span>Ширина: <strong className="text-white">{geometry.strap.widthMm} мм</strong></span>
        <span>Центр. отверстие: <strong className="text-white">{Math.round(geometry.strap.centerHoleX)} мм</strong></span>
        <span>Отверстий: <strong className="text-white">{geometry.adjustmentHoles.length} шт.</strong></span>
        <span>Шлёвка: <strong className="text-white">{Math.round(geometry.keeper.cutLengthMm)} × {geometry.keeper.widthMm} мм</strong></span>
        <span>Листов PDF: <strong className="text-white">{totalPages}</strong></span>
      </div>

      {geometry.validation.issues.length > 0 && (
        <div className="mt-3 rounded-md border border-stitch/30 bg-stitch/15 p-3 text-xs leading-5 text-white">
          {geometry.validation.issues.map((issue) => (
            <p key={issue.id}>⚠ {issue.message}</p>
          ))}
        </div>
      )}

      {/* PDF buttons */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={pdfUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!pdfUrl}
          onClick={(e) => { if (!pdfUrl) e.preventDefault(); }}
          className={`inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-mint ${!pdfUrl ? 'pointer-events-none opacity-45' : ''}`}
        >
          <ExternalLink size={17} />
          {pdfLoading ? 'Генерация PDF...' : 'Открыть PDF'}
        </a>
        <a
          href={pdfUrl ?? undefined}
          download={`belt-pattern-${params.wearableCircumferenceMm}mm.pdf`}
          aria-disabled={!pdfUrl}
          onClick={(e) => { if (!pdfUrl) e.preventDefault(); }}
          className={`inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${!pdfUrl ? 'pointer-events-none opacity-45' : ''}`}
        >
          <Download size={17} />
          Скачать PDF
        </a>
      </div>

      {/* TXT spec as secondary */}
      <button
        type="button"
        onClick={downloadSpec}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/78 transition hover:bg-white/10"
      >
        <Download size={14} />
        Скачать спецификацию TXT
      </button>

      <div className="mt-3 flex items-start gap-2 rounded-md border border-white/12 p-3 text-xs leading-5 text-white/58">
        <FlaskConical size={14} className="mt-0.5 shrink-0" />
        <span>
          Статус: <strong className="text-white/80">Прототип обязателен.</strong> Перед изготовлением партии проверьте геометрию на физическом образце с вашей конкретной пряжкой и шлёвкой.
        </span>
      </div>
    </section>
  );
}
