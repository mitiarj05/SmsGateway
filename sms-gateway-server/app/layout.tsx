import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SMSTSIKA",
  description: "Panneau de contrôle de la passerelle SMS",
  appleWebApp: {
    capable: true,
    title: "SMSTSIKA",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      {/* Pas de script inline ici : Next 16 le refuse dans le layout.
           Le thème s'initialise au montage (CoquilleTableauDeBord, /login) depuis
          localStorage — persistant en navigation SPA. */}
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}
