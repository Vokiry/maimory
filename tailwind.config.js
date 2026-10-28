/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mocha: {
          rosewater: '#f5e0dc',
          flamingo:  '#f2cdcd',
          pink:      '#f5c2e7',
          mauve:     '#cba6f7',
          red:       '#f38ba8',
          maroon:    '#eba0ac',
          peach:     '#fab387',
          yellow:    '#f9e2af',
          green:     '#a6e3a1',
          teal:      '#94e2d5',
          sky:       '#89dceb',
          sapphire:  '#74c7ec',
          blue:      '#89b4fa',
          lavender:  '#b4befe',
          text:      '#cdd6f4',
          subtext1:  '#bac2de',
          subtext0:  '#a6adc8',
          overlay2:  '#9399b2',
          overlay1:  '#7f849c',
          overlay0:  '#6c7086',
          surface2:  '#585b70',
          surface1:  '#45475a',
          surface0:  '#313244',
          base:      '#1e1e2e',
          mantle:    '#181825',
          crust:     '#11111b',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-mauve': '0 0 25px -5px rgba(203, 166, 247, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(137, 180, 250, 0.4)',
        'glow-teal': '0 0 25px -5px rgba(148, 226, 213, 0.4)',
        'glow-peach': '0 0 25px -5px rgba(250, 179, 135, 0.4)',
        'glow-green': '0 0 25px -5px rgba(166, 227, 161, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
