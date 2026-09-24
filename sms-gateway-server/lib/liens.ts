import { nanoid } from 'nanoid'
import { supabaseAdmin } from './supabase-serveur'

/**
 * Raccourcis (SMS -> Web) : un code court par destinataire,
 * résolu en page de confirmation au clic + notification au client.
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

/** Code court unique (5 caractères, régénéré en cas de collision). */
export async function genererCode(longueur = 5): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = nanoid(longueur)
    const { data } = await supabaseAdmin
      .from('liens')
      .select('id')
      .eq('id', code)
      .limit(1)
    if (!data || data.length === 0) return code
  }
  throw new Error('Impossible de générer un code de raccourci unique')
}
