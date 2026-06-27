import { useEffect, useState } from 'react';
import { Box, FileText } from 'lucide-react';
import { PatternPreview } from './PatternPreview';
import { ProductMockup } from './ProductMockup';
import type { PatternGeometry, WalletPatternParams } from '../types/pattern';

type PreviewTabsProps = {
  geometry: PatternGeometry;
  params: WalletPatternParams;
  activeView: 'product' | 'pattern';
};

export function PreviewTabs({ geometry, params, activeView }: PreviewTabsProps) {
  const [selectedView, setSelectedView] = useState(activeView);

  useEffect(() => {
    setSelectedView(activeView);
  }, [activeView]);

  const tabs: { id: 'product' | 'pattern'; label: string; icon: typeof Box }[] = [
    { id: 'product', label: 'Изделие', icon: Box },
    { id: 'pattern', label: 'Выкройка', icon: FileText },
  ];

  return (
    <section className="grid gap-4">
      <div className="inline-flex w-full gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-soft backdrop-blur sm:w-auto sm:self-start">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = selectedView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedView(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                active ? 'bg-ink text-white shadow-soft' : 'text-ink/55 hover:text-ink'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={selectedView} className="reveal">
        {selectedView === 'product' ? <ProductMockup params={params} /> : <PatternPreview geometry={geometry} />}
      </div>
    </section>
  );
}
