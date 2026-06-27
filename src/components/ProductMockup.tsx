import { CheckCircle2, Layers, Maximize2, Scan } from 'lucide-react';
import type { WalletPatternParams } from '../types/pattern';
import { WalletScene3D } from './WalletScene3D';

type ProductMockupProps = {
  params: WalletPatternParams;
};

export function ProductMockup({ params }: ProductMockupProps) {
  const specs = [
    { icon: Maximize2, label: 'Готовый размер', value: `${params.widthMm} × ${params.heightMm} мм` },
    { icon: Layers, label: 'Карманы', value: `${params.pocketCount} шт.` },
    { icon: Scan, label: 'Скругление', value: `${params.cornerRadiusMm} мм` },
    { icon: CheckCircle2, label: 'Статус', value: 'Готово к выпуску' },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Ваше изделие</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-snugger text-ink">
            Кардхолдер по вашим параметрам
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink/56">
            Интерактивный 3D-рендер обновляется в реальном времени. Проверьте пропорции и характер изделия до экспорта.
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line bg-sage px-3 py-1 text-[11px] font-semibold text-ink/64 sm:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leather" />
          Real-time
        </span>
      </div>

      {/* Studio stage */}
      <div className="relative mt-5 bg-[radial-gradient(circle_at_50%_15%,#fdf9f2_0%,#ece1d0_52%,#d8cab6_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <WalletScene3D params={params} />
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-surface/80 px-3 py-1 font-mono text-[11px] text-ink/50 shadow-soft backdrop-blur">
          {params.widthMm} × {params.heightMm} мм · {params.pocketCount} карм.
        </div>
      </div>

      {/* Spec grid */}
      <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.label} className="bg-surface px-5 py-4">
              <Icon size={16} className="text-leather" />
              <p className="mt-2.5 text-[12px] font-medium text-ink/50">{spec.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink tnum">{spec.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
