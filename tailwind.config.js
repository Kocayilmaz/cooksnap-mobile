/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ne-pisirsem (web) app/globals.css ile aynı marka renkleri — web ve
      // mobil aynı görsel kimliği paylaşsın diye buradan kopyalandı.
      colors: {
        'brand-orange': '#f2600c',
        'brand-orange-dark': '#c94e09',
        'brand-red': '#e8272b',
        'surface-warm': '#fffaf5',
        'surface-card': '#ffffff',
        'surface-border': '#f0dfd0',
        'surface-text-muted': '#8a7a6d',
        'state-success': '#1a8f4f',
        'state-error': '#e8272b',
      },
    },
  },
  plugins: [],
};
