import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase côté navigateur — utilisé uniquement pour le OAuth Google
 * (signInWithOAuth). L'auth applicative (admin / clients) garde ses propres
 * cookies signés ; ce client ne sert qu'à l'échange OAuth.
 */
export function creerSupabaseNavigateur() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cleAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cleAnon) {
    throw new Error(
      'Supabase Auth non configuré — ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local'
    )
  }
  return createBrowserClient(url, cleAnon)
}
