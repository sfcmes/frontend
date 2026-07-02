/** @type {import('tailwindcss').Config} */
// [MES] Tailwind config — maps tokens.css CSS variables to utility classes.
// No hex values here; tokens.css is the only file in the codebase with hex.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand-navy': 'var(--brand-navy)',
        'brand-gold': 'var(--brand-gold)',
        'brand-red': 'var(--brand-red)',
        'mes-bg': 'var(--mes-bg)',
        'mes-surface': 'var(--mes-surface)',
        'mes-surface-2': 'var(--mes-surface-2)',
        'mes-text': 'var(--mes-text)',
        'mes-muted': 'var(--mes-text-muted)',
        'mes-border': 'var(--mes-border)',
        'mes-accent': 'var(--mes-accent)',
        'mes-accent-ink': 'var(--mes-accent-ink)',
        'status-planning': 'var(--status-planning)',
        'status-manufactured': 'var(--status-manufactured)',
        'status-transported': 'var(--status-transported)',
        'status-accepted': 'var(--status-accepted)',
        'status-installed': 'var(--status-installed)',
        'status-rejected': 'var(--status-rejected)',
        'status-po-draft': 'var(--status-po-draft)',
        'status-po-submitted': 'var(--status-po-submitted)',
        'status-po-ordered': 'var(--status-po-ordered)',
        'status-po-received': 'var(--status-po-received)',
        'sem-info': 'var(--sem-info)',
        'sem-success': 'var(--sem-success)',
        'sem-warn': 'var(--sem-warn)',
        'sem-neutral': 'var(--sem-neutral)',
        'sem-danger': 'var(--sem-danger)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
      },
      minWidth: { touch: '48px' },
      minHeight: { touch: '48px' },
    },
  },
  plugins: [],
};
