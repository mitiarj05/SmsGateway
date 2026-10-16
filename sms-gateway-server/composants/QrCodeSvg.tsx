'use client'

import QRCode from 'react-qr-code'

interface PropsQrCode {
  valeur: string
  taille?: number
  etiquette?: string
}

/** QR généré localement en SVG : aucune dépendance externe, fonctionne hors-ligne. */
export default function QrCodeSvg({ valeur, taille = 200, etiquette }: PropsQrCode) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md dark:border-zinc-700">
        <QRCode
          value={valeur || ' '}
          size={taille}
          bgColor="#FFFFFF"
          fgColor="#1C1917"
          className="h-auto w-full rounded-lg"
          style={{ maxWidth: taille, maxHeight: taille }}
          aria-label={etiquette || 'QR Code'}
        />
      </div>
      {etiquette && <p className="mt-2 text-center text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{etiquette}</p>}
    </div>
  )
}
