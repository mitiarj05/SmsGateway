/**
 * URL publique de la passerelle (utilisée dans les e-mails : clé API).
 * Ordre : URL_PUBLIQUE explicite > hôte de la requête (domaine Vercel
 * ou IP LAN automatiquement) > VERCEL_URL > localhost.
 */

/** URL publique de la passerelle (domaine de production).
 * Ordre : URL_PUBLIQUE explicite > hôte de la requête (domaine Vercel
 * ou IP LAN automatiquement) > VERCEL_URL > localhost. Ainsi les liens
 * générés sont joignables sans aucune configuration dans la plupart des cas.
 */
export function urlPublique(hoteRequete?: string | null): string {
  const explicite = process.env.URL_PUBLIQUE?.trim()
  if (explicite) return explicite.replace(/\/$/, '')
  const hote = (hoteRequete ?? '').trim().replace(/\/$/, '')
  if (hote && !/^(localhost|127\.)/.test(hote)) {
    const estIp = /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(hote)
    return `${estIp ? 'http' : 'https'}://${hote}`
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}
