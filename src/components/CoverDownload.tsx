import { useEffect, useState } from 'react';
import { Check, Download, ExternalLink, FileText, FlaskConical } from 'lucide-react';
import { countCoverPdfPages, createCoverPdfBlobAsync } from '../lib/pdf/generateCoverPdf';
import type { CoverGeometry, CoverPatternInput } from '../types/cover';

type CoverDownloadProps = {
  geometry: CoverGeometry;
  params: CoverPatternInput;
};

const productTypeLabel: Record<string, string> = {
  passport: 'Обложка для паспорта',
  'a5-notebook': 'Обложка для блокнота A5',
  'a4-document': 'Папка для документов A4',
  custom: 'Обложка (нестандартный размер)',
};

function generateCoverSpec(params: CoverPatternInput, geometry: CoverGeometry): string {
  const lines = [
    `${productTypeLabel[params.productType] ?? 'ОБЛОЖКА'} — ПРОИЗВОДСТВЕННАЯ СПЕЦИФИКАЦИЯ`,
    '============================================================',
    '',
    `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    '--- ПАРАМЕТРЫ ИЗДЕЛИЯ ---',
    `Тип изделия:          ${productTypeLabel[params.productType] ?? params.productType}`,
    `Размер документа:     ${params.docWidthMm} × ${params.docHeightMm} мм`,
    `Ширина корешка:       ${params.spineWidthMm} мм`,
    `Припуск шва:          ${params.seamAllowanceMm} мм`,
    `Радиус угла:          ${params.cornerRadiusMm} мм`,
    `Толщина кожи:         ${params.leatherThicknessMm} мм`,
    '',
    '--- ДЕТАЛИ КРОЯ ---',
    ...geometry.pieces.map((p) => `  ${p.name}: ${Math.round(p.width)} × ${Math.round(p.height)} мм`),
    '',
    '--- ИНСТРУКЦИЯ ПО СБОРКЕ ---',
    ...geometry.assemblyNotes.map((n, i) => `  ${i + 1}. ${n}`),
    '',
    '--- СТАТУС ---',
    'Требуется физический прототип перед изготовлением партии.',
  ];
  return lines.join('\n');
}

export function CoverDownload({ geometry, params }: CoverDownloadProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const totalPages = countCoverPdfPages(geometry);

  const checks = [
    { label: `PDF 1:1 · ${totalPages} стр. (спека + детали кроя)`, complete: true },
    { label: 'Контрольная линейка 10 см на каждом листе', complete: true },
    { label: 'Линии сгиба корешка отмечены', complete: true },
    { label: 'Крупные детали разбиты на листы для склейки', complete: true },
    { label: 'Инструкция по сборке в документе', complete: geometry.assemblyNotes.length > 0 },
  ];

  useEffect(() => {
    let url: string | null = null;
    setPdfLoading(true);
    createCoverPdfBlobAsync(params, geometry).then((blob) => {
      url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfLoading(false);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [params, geometry]);

  const downloadSpec = () => {
    const content = generateCoverSpec(params, geometry);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-spec-${params.productType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-line bg-ink p-6 text-white shadow-lift">
      <div className="flex items-start gap-3">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12">
          <FileText size={18} />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">Экспорт · Обложка</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-snugger">Производственная документация</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            PDF в масштабе 1:1 с деталями кроя. Крупные детали автоматически разбиваются на листы A4 с метками склейки.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-5 rounded-xl border border-white/12 bg-white/8 p-3">
        <p className="mb-2 text-sm font-semibold">Состав PDF</p>
        <div className="grid gap-2 text-sm text-white/78">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${c.complete ? 'bg-leather text-white' : 'bg-white/15 text-white/45'}`}>
                <Check size={13} />
              </span>
              <span className="text-xs">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pieces summary */}
      <div className="mt-3 rounded-xl border border-white/10 bg-white/6 p-3 text-xs text-white/70 grid gap-1.5">
        {geometry.pieces.map((piece) => (
          <span key={piece.id} className="flex justify-between">
            <span>{piece.name}</span>
            <strong className="text-white tnum">{Math.round(piece.width)} × {Math.round(piece.height)} мм</strong>
          </span>
        ))}
      </div>

      {geometry.validation.issues.length > 0 && (
        <div className="mt-3 rounded-xl border border-stitch/30 bg-stitch/15 p-3 text-xs leading-5 text-white">
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
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-leather-tint ${!pdfUrl ? 'pointer-events-none opacity-45' : ''}`}
        >
          <ExternalLink size={17} />
          {pdfLoading ? 'Генерация PDF…' : 'Открыть PDF'}
        </a>
        <a
          href={pdfUrl ?? undefined}
          download={`cover-${params.productType}.pdf`}
          aria-disabled={!pdfUrl}
          onClick={(e) => { if (!pdfUrl) e.preventDefault(); }}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${!pdfUrl ? 'pointer-events-none opacity-45' : ''}`}
        >
          <Download size={17} />
          Скачать PDF
        </a>
      </div>

      <button
        type="button"
        onClick={downloadSpec}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/78 transition hover:bg-white/10"
      >
        <Download size={14} />
        Скачать спецификацию TXT
      </button>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/12 p-3 text-xs leading-5 text-white/58">
        <FlaskConical size={14} className="mt-0.5 shrink-0" />
        <span>
          Статус: <strong className="text-white/80">Прототип обязателен.</strong> Проверьте все размеры на бумажном макете перед раскроем кожи.
        </span>
      </div>
    </section>
  );
}
