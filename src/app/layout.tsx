import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lebensqualitäts-Karte',
  description: 'Interaktive Karte zur Bewertung der Lebensqualität basierend auf nahegelegenen Einrichtungen. Entdecke die Lebensqualität in deiner Stadt!',
  keywords: ['Lebensqualität', 'Karte', 'Städte', 'Wohnen', 'Infrastruktur', 'Deutschland'],
  authors: [{ name: 'Lebensqualitäts-Karte Team', url: 'https://lifequalitymap.vercel.app' }],
  creator: 'made with ❤️ from Greifswald',
  publisher: 'Lebensqualitäts-Karte',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lifequalitymap.vercel.app'),
  openGraph: {
    title: 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt',
    description: '🍀 Interaktive Karte zur Bewertung der Lebensqualität basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur. Finde heraus, wie lebenswert deine Stadt ist!',
    url: 'https://lifequalitymap.vercel.app',
    siteName: 'Lebensqualitäts-Karte',
    images: [
      {
        url: '/og_screenshot.jpg',
        width: 1200,
        height: 630,
        alt: 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lebensqualitäts-Karte - Entdecke die Lebensqualität in deiner Stadt',
    description: '🍀 Interaktive Karte zur Bewertung der Lebensqualität basierend auf Bildung, Gesundheit, Freizeit und Infrastruktur.',
    images: ['/og_screenshot.jpg'],
    creator: '@lebensqualitaet_karte',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // später hinzufügen
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍀</text></svg>",
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍀</text></svg>",
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
