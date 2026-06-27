import { useEffect, useState, type ReactNode } from 'react';

type ModulePreviewTabsProps = {
  productLabel: string;
  product: ReactNode;
  pattern: ReactNode;
  activeView: 'product' | 'pattern';
};

export function ModulePreviewTabs({ productLabel, product, pattern, activeView }: ModulePreviewTabsProps) {
  const [selectedView, setSelectedView] = useState(activeView);

  useEffect(() => {
    setSelectedView(activeView);
  }, [activeView]);

  return (
    <section className="grid gap-4">
      <div className="inline-flex w-full rounded-xl border border-line bg-surface p-1 shadow-soft sm:w-auto">
        <button
          type="button"
          onClick={() => setSelectedView('product')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            selectedView === 'product' ? 'bg-ink text-white shadow-sm' : 'text-ink/58 hover:bg-surface2'
          }`}
        >
          {productLabel}
        </button>
        <button
          type="button"
          onClick={() => setSelectedView('pattern')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            selectedView === 'pattern' ? 'bg-ink text-white shadow-sm' : 'text-ink/58 hover:bg-surface2'
          }`}
        >
          Выкройка для печати
        </button>
      </div>

      {selectedView === 'product' ? product : pattern}
    </section>
  );
}
