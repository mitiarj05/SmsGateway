import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

interface LigneHoraire {
  hour: string
  count: number
}

export async function GET() {
  try {
    const maintenant = new Date()
    const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
    const debutJourneeIso = debutJournee.toISOString()

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('date_creation, statut')
      .gte('date_creation', debutJourneeIso)
      .lte('date_creation', maintenant.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const heures: LigneHoraire[] = []
    for (let i = 23; i >= 0; i--) {
      const heureCourante = new Date(maintenant.getTime() - i * 3600000)
      const etiquetteHeure = heureCourante.toLocaleTimeString('fr-FR', { hour: '2-digit', hour12: false })
      const debutHeure = new Date(heureCourante.getTime() - 3600000).toISOString()
      const finHeure = heureCourante.toISOString()

      const compteur = (data ?? []).filter(t => {
        const horodatageTache = new Date(t.date_creation)
        return horodatageTache >= new Date(debutHeure) && horodatageTache < new Date(finHeure)
      }).length

      heures.push({ hour: etiquetteHeure, count: compteur })
    }

    return NextResponse.json({ hourly: heures })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
