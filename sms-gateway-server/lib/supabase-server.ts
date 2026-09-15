import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local (redémarre `npm run dev` après modification)')
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local (redémarre `npm run dev` après modification)')
  }

  if (!cachedAdmin) {
    cachedAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return cachedAdmin
}

// Compat : accès paresseux pour ne pas crasher à l'import
// (un `throw` au top-level fait planter toutes les routes qui importent ce module)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})