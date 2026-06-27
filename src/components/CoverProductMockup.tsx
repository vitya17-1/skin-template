import { BookOpen, Layers, Maximize2, ShieldCheck } from 'lucide-react';
import type { CoverGeometry, CoverPatternInput } from '../types/cover';
import { CoverScene3D } from './CoverScene3D';

type CoverProductMockupProps = {
  geometry: CoverGeometry;
  params: CoverPatternInput;
};

export function CoverProductMockup({ geometry, params }: CoverProductMockupProps) {
  const specs = [
    { icon: Maximize2, label: 'Документ', value: `${params.docWidthMm} × ${params.docHeightMm} мм` },
    { icon: BookOpen, label: 'Корешок', value: `${params.spineWidthMm} мм` },
    { icon: Layers, label: 'Детали', value: `${geometry.pieces.length} шт.` },
    { icon: ShieldCheck, label: 'Статус', value: 'Требуется прототип' },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="px-6 pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Ваше изделие</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-snugger text-ink">Обложка по вашим параметрам</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/56">
          3D-модель показывает пропорции документа, раскрытие корешка, подкладку и внутренние карманы.
        </p>
      </div>
      <div className="mt-5 bg-[radial-gradient(circle_at_50%_15%,#fdf9f2_0%,#ece1d0_52%,#d8cab6_100%)]">
        <CoverScene3D geometry={geometry} params={params} />
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.label} className="bg-surface px-5 py-4">
              <Icon size={16} className="text-leather" />
              <p className="mt-2 text-xs font-medium text-ink/50">{spec.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink tnum">{spec.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
