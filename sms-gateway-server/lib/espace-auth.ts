import type { NextRequest } from 'next/server'
import { creerSupabaseRoute } from './supabase-route'
import { supabaseAdmin } from './supabase-serveur'
import { lireSessionClient } from './session-client'

/**
 * Phase 2 — Résout l'application cliente d'une requête /api/espace/*.
 *
 * 1. Session Supabase (comptes standard) → application liée par `user_id` ;
 * 2. repli : cookie HMAC `sms_client` historique (transition).
 *
 * Un compte suspendu est refusé (retour null) dans les deux cas.
 * Les routes gardent leur test `if (!idApplication) → 401` inchangé.
 *
 * Tolérant pré-migration : si les colonnes `user_id`/`suspendu` n'existent
 * pas encore, on retombe sur le cookie sans bloquer.
 */
export async function resoudreApplicationEspace(request: NextRequest): Promise<string | null> {
  try {
    const supabase = await creerSupabaseRoute()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: app } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .order('date_creation', { ascending: false })
        .limit(1)
      const id = (app?.[0] as { id: string } | undefined)?.id
      if (id && !(await estSuspendu(id))) return id
      if (id) return null
    }
  } catch {
    /* repli cookie ci-dessous */
  }
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) return null
    if (await estSuspendu(idApplication)) return null
    return idApplication
  } catch {
    return null
  }
}

/** true si l'application est suspendue (false si colonne absente). */
async function estSuspendu(idApplication: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('suspendu')
      .eq('id', idApplication)
      .single()
    if (error || !data) return false
    return (data as { suspendu?: boolean }).suspendu === true
  } catch {
    return false
  }
}
