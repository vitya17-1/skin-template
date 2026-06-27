import { ArrowRight, Github, Ruler, ScanLine, Sparkles } from 'lucide-react';

type HeroProps = {
  onStart: () => void;
};

// Название бренда задаёт владелец проекта. Пока показываем только знак.
const BRAND_NAME = '';

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-[9px] bg-ink" />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="none" aria-hidden="true">
          <path d="M5 18 L12 5 L19 18 Z" stroke="#F1E7D9" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 18 L12 11.5 L15 18" stroke="#A86C42" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </span>
      {BRAND_NAME ? (
        <span className="font-display text-[17px] font-semibold tracking-snugger text-ink">{BRAND_NAME}</span>
      ) : null}
    </span>
  );
}

export function Hero({ onStart }: HeroProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Top navigation */}
      <nav className="sticky top-0 z-40">
        <div className="glass border-b border-line">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
            <Wordmark />
            <div className="hidden items-center gap-8 text-sm font-medium text-ink/64 md:flex">
              <a href="#constructor" className="transition hover:text-ink">Конструктор</a>
              <a href="#constructor" className="transition hover:text-ink">Изделия</a>
              <a href="#constructor" className="transition hover:text-ink">Документация</a>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href="#constructor"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/60 transition hover:text-ink sm:flex"
              >
                <Github size={16} />
                Войти
              </a>
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                Открыть студию
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero body */}
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-14 pt-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-24">
        <div className="reveal" style={{ animationDelay: '40ms' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-medium tracking-snugger text-ink/70 shadow-soft backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leather/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leather" />
            </span>
            Параметрический движок выкроек
          </span>

          <h1 className="mt-7 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-tightest text-ink sm:text-6xl lg:text-[4.2rem]">
            Изделия из кожи,
            <br />
            рассчитанные
            <span className="relative ml-3 inline-block">
              <span className="bg-gradient-to-r from-leather to-leather-deep bg-clip-text text-transparent">точно</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" aria-hidden="true">
                <path d="M2 7 Q 100 1 198 6" stroke="#A86C42" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-ink/64">
            Не генератор картинок, а инженерная система. Задаёте размеры — получаете проверяемую геометрию,
            припуски по стандарту и документацию&nbsp;1:1, готовую к раскрою.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:shadow-float"
            >
              Создать изделие
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#constructor"
              className="inline-flex items-center gap-2 rounded-xl border border-line2 bg-surface/60 px-6 py-3.5 text-[15px] font-semibold text-ink backdrop-blur transition hover:bg-surface"
            >
              Как это работает
            </a>
          </div>

          {/* Trust / proof row */}
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-7">
            {[
              ['100%', 'масштаб печати 1:1'],
              ['5', 'модулей изделий'],
              ['0.25', 'мм допуск сборки'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-2xl font-semibold tracking-snugger text-ink tnum">{value}</p>
                <p className="mt-1 text-[13px] leading-5 text-ink/56">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product showcase */}
        <div className="reveal relative" style={{ animationDelay: '160ms' }}>
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_60%_30%,rgba(168,108,66,0.16),transparent_60%)] blur-2xl" />

          <div className="relative rounded-3xl border border-line bg-gradient-to-b from-surface to-surface2 p-2.5 shadow-float">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ink/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink/12" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink/12" />
              </div>
              <span className="font-mono text-[11px] tracking-snugger text-ink/40">cardholder · v1</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold text-ink/60">
                <span className="h-1.5 w-1.5 rounded-full bg-leather" />
                live
              </span>
            </div>

            {/* Leather product render */}
            <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_18%,#fbf6ee,#e9ddcc_55%,#d3c5b2)] p-8">
              <div className="animate-float">
                <svg viewBox="0 0 320 220" className="mx-auto block w-full max-w-[360px] drop-shadow-2xl" aria-label="Премиальный кардхолдер">
                  <defs>
                    <linearGradient id="heroLeather" x1="0" y1="0" x2="0.7" y2="1">
                      <stop offset="0%" stopColor="#b87b4d" />
                      <stop offset="55%" stopColor="#9a6238" />
                      <stop offset="100%" stopColor="#6f4527" />
                    </linearGradient>
                    <linearGradient id="heroSheen" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                    <filter id="heroShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#3a271b" floodOpacity="0.28" />
                    </filter>
                  </defs>

                  <g filter="url(#heroShadow)">
                    <rect x="46" y="36" width="228" height="148" rx="18" fill="url(#heroLeather)" />
                    <rect x="46" y="36" width="228" height="148" rx="18" fill="url(#heroSheen)" />
                    {/* Stitch line */}
                    <rect
                      x="54" y="44" width="212" height="132" rx="13"
                      fill="none" stroke="#fbeede" strokeOpacity="0.55" strokeWidth="1.4" strokeDasharray="3 4"
                    />
                    {/* Center spine */}
                    <line x1="160" y1="50" x2="160" y2="170" stroke="#2d1d12" strokeOpacity="0.32" strokeWidth="2" strokeDasharray="5 5" />
                    {/* Pockets */}
                    {[0, 1].map((i) => (
                      <g key={i}>
                        <rect
                          x={70 + i * 102} y="86" width="80" height="62" rx="9"
                          fill="#c98a55" stroke="#3b291d" strokeWidth="1.2" opacity="0.95"
                        />
                        <line x1={80 + i * 102} y1="98" x2={140 + i * 102} y2="98" stroke="#fff4e8" strokeOpacity="0.4" strokeWidth="1.2" />
                      </g>
                    ))}
                  </g>
                </svg>
              </div>

              {/* Floating spec chips */}
              <div className="absolute left-5 top-6 rounded-xl border border-line bg-surface/90 px-3 py-2 shadow-lift backdrop-blur animate-float" style={{ animationDelay: '0.8s' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                  <Ruler size={13} className="text-leather" />
                  85.6 × 54 мм
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ink/45">ISO/IEC 7810 ID-1</p>
              </div>

              <div className="absolute bottom-6 right-5 rounded-xl border border-line bg-surface/90 px-3 py-2 shadow-lift backdrop-blur animate-float" style={{ animationDelay: '1.4s' }}>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                  <ScanLine size={13} className="text-leather" />
                  Геометрия проверена
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-ink/45">0 ошибок · 6 правил</p>
              </div>
            </div>

            {/* Footer strip */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink/55">
                <Sparkles size={13} className="text-leather" />
                Документация готова к печати
              </span>
              <span className="font-mono text-[11px] text-ink/40">PDF · SVG · DXF</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
