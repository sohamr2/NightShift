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
        bg:            '#09090B',
        surface:       '#111116',
        raised:        '#18181F',
        dim:           '#27272F',
        border:        '#222228',         // hairline border — dark
        'border-s':    '#2E2E38',         // stronger border on hover
        muted:         '#6E6E80',
        subtle:        '#A1A1AA',
        text:          '#E4E4EF',
        bright:        '#FAFAFF',
        accent:        '#7C6DF0',
        'accent-h':    '#917EF5',         // hover tint
        'accent-d':    '#1D1A33',         // dim background (was accent-dim)
        danger:        '#F05252',
        warning:       '#F5A623',
        success:       '#34D399',
      },
      ringColor: {
        border:   '#222228',
        'border-s': '#2E2E38',
        accent:   '#7C6DF0',
        'accent-d': '#3D3566',
        danger:   '#F05252',
        warning:  '#F5A623',
        success:  '#34D399',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px #222228',
        focus: '0 0 0 3px rgba(124,109,240,0.3)',
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
