'use client'

import { useState } from 'react'
import { QrCode, Loader2 } from 'lucide-react'

interface PropsQrCode {
  valeur: string
  taille?: number
  etiquette?: string
}

export default function QrCodeSvg({ valeur, taille = 200, etiquette }: PropsQrCode) {
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(false)

  const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=${taille}x${taille}&data=${encodeURIComponent(valeur)}&margin=10`

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center rounded-2xl bg-white p-3 shadow-md border border-slate-200 dark:border-zinc-700">
        {chargement && !erreur && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl dark:bg-zinc-900/90">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
        {/* Image du QR Code */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlQr}
          alt={etiquette || 'QR Code'}
          width={taille}
          height={taille}
          onLoad={() => setChargement(false)}
          onError={() => {
            setChargement(false)
            setErreur(true)
          }}
          className="rounded-lg object-contain"
        />
        {erreur && (
          <div className="flex h-48 w-48 flex-col items-center justify-center p-4 text-center text-xs text-slate-400">
            <QrCode className="h-8 w-8 mb-2 text-slate-300" />
            <span>Impossible d'afficher le QR code. Réseau indisponible.</span>
          </div>
        )}
      </div>
      {etiquette && <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 text-center">{etiquette}</p>}
    </div>
  )
}
