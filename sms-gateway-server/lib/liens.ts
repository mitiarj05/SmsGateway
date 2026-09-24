import { nanoid } from 'nanoid'
import { supabaseAdmin } from './supabase-serveur'

/**
 * Raccourcis (SMS -> Web) : un code court par destinataire,
 * résolu en page de confirmation au clic + notification au client.
 */

/** URL publique de la passerelle (domaine de production). */
export function urlPublique(): string {
  const explicite = process.env.URL_PUBLIQUE?.trim()
  if (explicite) return explicite.replace(/\/$/, '')
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
