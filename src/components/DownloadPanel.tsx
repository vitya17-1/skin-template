import { useEffect, useState } from 'react';
import { Check, Download, ExternalLink, FileCheck2, FlaskConical } from 'lucide-react';
import { simpleWalletDefaults } from '../data/templates/walletTemplates';
import { createPatternDebugManifestBlob } from '../lib/debug/buildPatternDebugManifest';
import { createLayoutPlan } from '../lib/layout/pageLayout';
import { createWalletPdfBlobAsync } from '../lib/pdf/generateWalletPdf';
import { createSimpleWalletPattern } from '../lib/patterns/wallet';
import type { PatternGeometry } from '../types/pattern';

type DownloadPanelProps = {
  geometry: PatternGeometry;
  validationMessages: string[];
};

export function DownloadPanel({ geometry, validationMessages }: DownloadPanelProps) {
  const geometryErrors = geometry.validation.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message);
  const layout = createLayoutPlan(geometry, { format: geometry.params.pageFormat, strategy: 'piece-per-page' });
  const layoutErrors = layout.validation.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message);
  const blockingMessages = [...validationMessages, ...geometryErrors, ...layoutErrors];
  const advisoryMessages = geometry.validation.issues.filter((issue) => issue.severity !== 'error').map((issue) => issue.message);
  const canDownload = blockingMessages.length === 0;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [testPdfUrl, setTestPdfUrl] = useState<string | null>(null);
  const pdfPageCount = layout.pages.length + 1;
  const checks = [
    { label: `PDF 1:1, ${pdfPageCount} стр. на ${layout.format}`, complete: layout.validation.isValid },
    { label: 'Контроль масштаба 100%', complete: geometry.params.printScale === 100 },
    { label: 'Контрольная линейка добавлена', complete: true },
    { label: 'Детали подписаны', complete: true },
    { label: 'Параметры изделия сохранены', complete: canDownload },
  ];

  useEffect(() => {
    if (!canDownload) {
      setPdfUrl(null);
      setManifestUrl(null);
      return;
    }

    let pdfObjectUrl: string | null = null;
    let manifestObjectUrl: string | null = null;
    createWalletPdfBlobAsync(geometry, { layout: { format: geometry.params.pageFormat, strategy: 'piece-per-page' } }).then((blob) => {
      pdfObjectUrl = URL.createObjectURL(blob);
      manifestObjectUrl = URL.createObjectURL(
        createPatternDebugManifestBlob(geometry, { layout: { format: geometry.params.pageFormat, strategy: 'piece-per-page' } }),
      );
      setPdfUrl(pdfObjectUrl);
      setManifestUrl(manifestObjectUrl);
    });
    return () => {
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
      if (manifestObjectUrl) URL.revokeObjectURL(manifestObjectUrl);
    };
  }, [canDownload, geometry]);

  useEffect(() => {
    let url: string | null = null;
    createWalletPdfBlobAsync(createSimpleWalletPattern(simpleWalletDefaults)).then((blob) => {
      url = URL.createObjectURL(blob);
      setTestPdfUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <section className="rounded-xl border border-black/10 bg-ink p-5 text-white shadow-soft">
      <div className="flex items-start gap-3">
        <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/12">
          <FileCheck2 size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">Экспорт</p>
          <h2 className="mt-1 text-xl font-semibold">Производственная документация готова</h2>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Система собрала файлы для изготовления из ваших параметров. Сегодня доступен PDF 1:1; SVG и DXF добавим
            следующими экспортами.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-white/12 bg-white/8 p-3">
        <p className="mb-2 text-sm font-semibold">Состав документации</p>
        <div className="grid gap-2 text-sm text-white/78">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${check.complete ? 'bg-mint text-ink' : 'bg-white/15 text-white/45'}`}>
                <Check size={13} />
              </span>
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={pdfUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!pdfUrl}
          onClick={(event) => {
            if (!pdfUrl) event.preventDefault();
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-mint ${
            pdfUrl ? '' : 'pointer-events-none opacity-45'
          }`}
        >
          <ExternalLink size={18} />
          Открыть PDF
        </a>
        <a
          href={pdfUrl ?? undefined}
          download={`${geometry.params.templateId}-pattern.pdf`}
          aria-disabled={!pdfUrl}
          onClick={(event) => {
            if (!pdfUrl) event.preventDefault();
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 ${
            pdfUrl ? '' : 'pointer-events-none opacity-45'
          }`}
        >
          <Download size={18} />
          Скачать PDF
        </a>
      </div>

      <a
        href={testPdfUrl ?? undefined}
        download="test-wallet-pattern.pdf"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/78 transition hover:bg-white/10"
      >
        <FlaskConical size={15} />
        Сгенерировать тестовую документацию
      </a>

      <a
        href={manifestUrl ?? undefined}
        download={`${geometry.params.templateId}-debug-manifest.json`}
        aria-disabled={!manifestUrl}
        onClick={(event) => {
          if (!manifestUrl) event.preventDefault();
        }}
        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/14 px-4 py-2.5 text-xs font-semibold text-white/66 transition hover:bg-white/10 ${
          manifestUrl ? '' : 'pointer-events-none opacity-45'
        }`}
      >
        Скачать отладочный манифест JSON
      </a>

      {blockingMessages.length > 0 ? (
        <div className="mt-3 text-xs leading-5 text-white/68">
          {blockingMessages.slice(0, 3).map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {blockingMessages.length === 0 && advisoryMessages.length > 0 ? (
        <div className="mt-3 text-xs leading-5 text-white/58">
          {advisoryMessages.slice(0, 2).map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
