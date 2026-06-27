import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core neutrals — warm, refined, near-black ink on a calm canvas
        ink: '#17150F',
        ink2: '#3D3A33',
        canvas: '#F6F3EC',
        surface: '#FFFFFF',
        surface2: '#FBF8F2',
        line: 'rgba(23, 21, 15, 0.08)',
        line2: 'rgba(23, 21, 15, 0.14)',

        // Brand accent — leather cognac
        hide: '#A86C42',
        leather: '#A86C42',
        'leather-deep': '#7E4F2E',
        'leather-tint': '#F1E7D9',

        // Functional
        stitch: '#B14B35',
        sage: '#E7EDE7',
        mint: '#EFE8DC',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        snugger: '-0.02em',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,21,15,0.04), 0 8px 24px rgba(23,21,15,0.06)',
        lift: '0 2px 4px rgba(23,21,15,0.04), 0 18px 48px rgba(23,21,15,0.12)',
        float: '0 24px 70px rgba(23,21,15,0.18)',
        glow: '0 0 0 1px rgba(168,108,66,0.18), 0 12px 36px rgba(168,108,66,0.16)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(168,108,66,0.32)' },
          '70%': { boxShadow: '0 0 0 8px rgba(168,108,66,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(168,108,66,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.2s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
