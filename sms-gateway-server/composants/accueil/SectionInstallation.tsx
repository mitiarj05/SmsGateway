'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import QrCodeSvg from '../../composants/QrCodeSvg'

const URL_APK = process.env.NEXT_PUBLIC_URL_APK || '/apk/smstsika.apk'
function urlApkAbsolue(): string {
  if (/^https?:\/\//i.test(URL_APK)) return URL_APK
  if (typeof window === 'undefined') return URL_APK
  return new URL(URL_APK, window.location.origin).href
}

const META = ['Android 8.0+', '~23 Mo', 'signature SMS IKA']

export default function SectionInstallation() {
  const [urlQrApk, setUrlQrApk] = useState(URL_APK)
  useEffect(() => { setUrlQrApk(urlApkAbsolue()) }, [])

  return (
    <section id="installer" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16 lg:px-8 lg:py-20">
      <div className="grid grid-cols-1 items-center gap-10 rounded-2xl border border-[#1C1917]/10 bg-white p-8 sm:grid-cols-[1fr_auto] sm:p-10">
        <div data-reveal>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8]">INSTALLATION RAPIDE</p>
          <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-[#1C1917] sm:text-4xl">
            Téléchargez l’application Android
          </h2>
          <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed text-stone-600">
            Scannez le QR code avec votre téléphone pour télécharger l’application relais.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={URL_APK}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black"
            >
              <Download className="h-4 w-4" /> Télécharger l’APK ↗
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {META.map((m) => (
              <li key={m} className="rounded-md border border-[#1C1917]/10 bg-[#F7F5F0] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-stone-600">
                {m}
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal="zoom" className="justify-self-center rounded-xl border border-[#1C1917]/10 bg-[#F7F5F0] p-6 text-center sm:justify-self-end">
          <QrCodeSvg valeur={urlQrApk} taille={168} etiquette="QR de téléchargement de l'application Android" />
          <p className="mt-3 font-sans text-xs font-bold text-[#1C1917]">
            Scannez pour installer l’application
          </p>
        </div>
      </div>
    </section>
  )
}
