import './globals.css'
import { Space_Grotesk, Manrope } from 'next/font/google'
import type { Metadata } from 'next'


const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })


export const metadata: Metadata = {
title: '300 Kings – AI-Powered Ad Campaigns',
description: 'Montreal-based agency combining AI with creative to scale your ads.'
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body className={`${spaceGrotesk.variable} ${manrope.variable} font-body`}>{children}</body>
</html>
)
}
