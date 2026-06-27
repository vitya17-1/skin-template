import { BadgeCheck, Briefcase, CreditCard, Footprints, Notebook, Wallet } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  status: 'prototype' | 'soon' | 'research';
  selectable: boolean;
  description: string;
  icon: typeof CreditCard;
};

const categories: Category[] = [
  {
    id: 'cardholder',
    name: 'Складной кардхолдер',
    status: 'prototype',
    selectable: true,
    description: 'Параметрический модуль работает; требуется физическая проверка мастером.',
    icon: CreditCard,
  },
  {
    id: 'wallet',
    name: 'Кошелек',
    status: 'research',
    selectable: false,
    description: 'Отдельный модуль с отделением для банкнот и собственной сборочной моделью.',
    icon: Wallet,
  },
  {
    id: 'belt',
    name: 'Ремень',
    status: 'prototype',
    selectable: true,
    description: 'Параметрический расчёт: длина, пряжка, отверстия, хвостовик, шлёвка.',
    icon: BadgeCheck,
  },
  {
    id: 'cover',
    name: 'Обложка',
    status: 'prototype',
    selectable: true,
    description: 'Паспорт, блокнот A5/A4: выкройка со всеми деталями и корешком.',
    icon: Notebook,
  },
  {
    id: 'bag',
    name: 'Сумка',
    status: 'soon',
    selectable: false,
    description: 'Панели, ручки, усилители и сборочные узлы.',
    icon: Briefcase,
  },
  {
    id: 'shoe',
    name: 'Обувь',
    status: 'research',
    selectable: false,
    description: 'Подготовлены требования к колодке, 3D/2D-развёртке и прототипу.',
    icon: Footprints,
  },
];

type ProductCategorySelectorProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

function statusLabel(status: Category['status']) {
  if (status === 'prototype') return 'Прототип';
  if (status === 'research') return 'Research';
  return 'Soon';
}

export function ProductCategorySelector({ selectedId, onSelect }: ProductCategorySelectorProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Шаг 1 · Изделие</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-snugger text-ink">Что хотите создать?</h2>
        <p className="mt-2 text-sm leading-6 text-ink/56">
          Кардхолдер, ремень и обложка доступны как инженерные прототипы. Кошелёк и обувь получают отдельные движки.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const selected = category.id === selectedId;
          const disabled = !category.selectable;

          return (
            <button
              key={category.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(category.id)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                selected
                  ? 'border-leather/50 bg-leather-tint/60 shadow-glow'
                  : 'border-line bg-surface2/50 hover:-translate-y-0.5 hover:border-leather/30 hover:shadow-soft'
              } ${disabled ? 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none' : ''}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    selected ? 'bg-ink text-leather-tint' : 'bg-surface text-leather ring-1 ring-line group-hover:bg-leather-tint/40'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    category.status === 'prototype'
                      ? 'bg-ink text-white'
                      : category.status === 'research'
                        ? 'bg-leather-tint text-leather-deep'
                        : 'bg-surface2 text-ink/45 ring-1 ring-line'
                  }`}
                >
                  {statusLabel(category.status)}
                </span>
              </span>
              <span className="mt-4 block font-display text-base font-semibold text-ink">{category.name}</span>
              <span className="mt-1 block text-xs leading-5 text-ink/55">{category.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
