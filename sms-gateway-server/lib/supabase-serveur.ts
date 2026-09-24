import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let clientAdminEnCache: SupabaseClient | null = null

export function obtenirSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local (redémarre `npm run dev` après modification)')
  }

  if (!cleService) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local (redémarre `npm run dev` après modification)')
  }

  if (!clientAdminEnCache) {
    clientAdminEnCache = createClient(url, cleService, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return clientAdminEnCache
}

// Compat : accès paresseux pour ne pas crasher à l'import
// (un `throw` au top-level fait planter toutes les routes qui importent ce module)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = obtenirSupabaseAdmin()
    const valeur = (client as unknown as Record<PropertyKey, unknown>)[prop]
    return typeof valeur === 'function' ? valeur.bind(client) : valeur
  },
})