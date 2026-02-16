/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(0 0% 100%)',
                foreground: 'hsl(222 47% 11%)',
                primary: {
                    DEFAULT: 'hsl(222 47% 11%)',
                    foreground: 'hsl(0 0% 98%)',
                },
                accent: 'hsl(210 40% 96%)',
                muted: 'hsl(210 40% 96%)',
                border: 'hsl(214 32% 91%)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            aspectRatio: {
                'product': '4 / 5',
            },
        },
    },
    plugins: [],
}
