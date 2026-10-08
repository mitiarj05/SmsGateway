import type { MetadataRoute } from 'next'

/**
 * Manifeste PWA : rend SMSTSIKA installable comme une application
 * (écran d'accueil Android/iOS, plein écran, icône dédiée).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SMSTSIKA — Passerelle SMS',
    short_name: 'SMSTSIKA',
    description: 'Console SMSTSIKA : envoyez des SMS via vos propres téléphones.',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0F19',
    theme_color: '#0B0F19',
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
