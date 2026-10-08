import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase côté routes API — échange le `code` OAuth contre une
 * session (cookies sb-* posés/lus via le magasin Next). Réservé au
 * callback Google ; le reste de l'app utilise le client admin + ses
 * propres sessions signées.
 */
export async function creerSupabaseRoute() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cleAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cleAnon) {
    throw new Error(
      'Supabase Auth non configuré — ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'
    )
  }
  const magasin = await cookies()
  return createServerClient(url, cleAnon, {
    cookies: {
      getAll() {
        return magasin.getAll()
      },
      setAll(aEcrire) {
        try {
          aEcrire.forEach(({ name, value, options }) => magasin.set(name, value, options))
        } catch {
          // Route appelée hors contexte d'écriture — l'échange a déjà eu lieu.
        }
      },
    },
  })
}
