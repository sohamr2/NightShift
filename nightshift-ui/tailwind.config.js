/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:  ['"Figtree"', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg:            '#FFFFFF',
        surface:       '#F9FAFB',
        raised:        '#F3F4F6',
        dim:           '#E5E7EB',
        border:        '#E5E7EB',
        'border-s':    '#D1D5DB',
        muted:         '#6B7280',
        subtle:        '#9CA3AF',
        text:          '#1F2937',
        bright:        '#111827',
        accent:        '#2563EB',
        'accent-h':    '#1D4ED8',
        'accent-d':    '#EFF6FF',
        danger:        '#DC2626',
        warning:       '#D97706',
        success:       '#059669',
      },
      ringColor: {
        border:     '#E5E7EB',
        'border-s': '#D1D5DB',
        accent:     '#2563EB',
        'accent-d': '#93C5FD',
        danger:     '#DC2626',
        warning:    '#D97706',
        success:    '#059669',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px #E5E7EB',
        focus: '0 0 0 3px rgba(37,99,235,0.15)',
      },
      keyframes: {
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
}
