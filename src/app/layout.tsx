import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'SB Durian Marketplace | 马来西亚榴莲的智慧市场',
  description: "Malaysia's Smart Durian Market — B2B2C platform connecting orchard owners, wholesalers, retailers and consumers.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen" style={{ color: '#F6F1E7' }}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
