import { walletTemplates } from '../data/templates/walletTemplates';
import type { WalletPatternParams, WalletTemplateId } from '../types/pattern';

type TemplateSelectorProps = {
  selectedId: WalletTemplateId;
  onSelect: (params: WalletPatternParams) => void;
};

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const meta: Record<WalletTemplateId, { difficulty: string; time: string; parts: string; fit: string }> = {
    'minimal-wallet': { difficulty: 'Начальный', time: '30-45 мин', parts: '2 детали', fit: 'первая работа' },
    'classic-bifold': { difficulty: 'Базовый', time: '1-2 часа', parts: '3 детали', fit: 'повседневный формат' },
    'card-wallet': { difficulty: 'Средний', time: '1-2 часа', parts: '5 деталей', fit: 'карты каждый день' },
    'long-wallet': { difficulty: 'Средний', time: '2-3 часа', parts: '5 деталей', fit: 'банкноты и карты' },
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Шаг 2 · Модель</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-snugger text-ink">Выберите модель</h2>
        <p className="mt-2 text-sm leading-6 text-ink/56">
          Модель задаёт конструкцию изделия. Размеры и параметры можно поменять дальше.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {walletTemplates.map((template) => {
          const selected = template.id === selectedId;
          const item = meta[template.id];
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.params)}
              className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                selected
                  ? 'border-leather/50 bg-leather-tint/60 shadow-glow'
                  : 'border-line bg-surface2/50 hover:-translate-y-0.5 hover:border-leather/30 hover:shadow-soft'
              }`}
            >
              <span className="flex gap-4">
                <span className="mt-0.5 flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_50%_30%,#f7ecde,#e9d8c0)] ring-1 ring-line">
                  <svg viewBox="0 0 120 86" className="h-16 w-20" aria-hidden="true">
                    <rect x="12" y="18" width="96" height="52" rx="10" fill="#9a6640" stroke="#2d221a" strokeWidth="3" />
                    <line x1="60" y1="24" x2="60" y2="64" stroke="#2d221a" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="5 5" />
                    {Array.from({ length: Math.min(template.params.pocketCount, 4) }, (_, index) => {
                      const col = index % 2;
                      const row = Math.floor(index / 2);
                      return (
                        <rect
                          key={index}
                          x={22 + col * 42}
                          y={30 + row * 18}
                          width="34"
                          height="12"
                          rx="3"
                          fill="#d19a68"
                          stroke="#3b291d"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold text-ink">{template.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{template.description}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {[item.difficulty, item.time, item.parts, item.fit].map((tag) => (
                      <span key={tag} className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-ink/55 ring-1 ring-line">
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
