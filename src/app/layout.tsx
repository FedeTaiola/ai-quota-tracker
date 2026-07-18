import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'AI Quota Tracker',
  description: 'Dashboard per tracciare i reset quota degli agenti AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased relative">
        <main className="container mx-auto px-5 pb-20 relative z-10 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  )
}
