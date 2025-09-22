content: [
'./app/**/*.{js,ts,jsx,tsx}',
'./components/**/*.{js,ts,jsx,tsx}',
],
theme: {
extend: {
colors: {
brand: {
blue: '#00aaff',
black: '#0a0a0a',
red: '#ff2a2a'
}
},
fontFamily: {
display: ['var(--font-space-grotesk)'],
body: ['var(--font-manrope)']
},
},
},
plugins: [],
} satisfies Config
