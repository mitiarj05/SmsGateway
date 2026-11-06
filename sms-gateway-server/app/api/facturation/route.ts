import { NextRequest, NextResponse } from 'next/server'
import { lireFacturation, moisActuel } from '@/lib/facturation'

/**
 * GET /api/facturation?mois=AAAA-MM — consommation par client (admin).
 * Recalcule le mois demandé avant lecture (défaut : mois courant).
 */
export async function GET(request: NextRequest) {
  try {
    const brut = request.nextUrl.searchParams.get('mois') ?? moisActuel()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(brut)) {
      return NextResponse.json(
        { error: 'Paramètre "mois" invalide (format AAAA-MM attendu)' },
        { status: 400 }
      )
    }
    const lignes = await lireFacturation(brut)
    const totaux = lignes.reduce(
      (acc, l) => ({
        total_facture: acc.total_facture + l.total_facture,
        sms_envoye: acc.sms_envoye + l.sms_envoye,
        sms_recu: acc.sms_recu + l.sms_recu,
        echec: acc.echec + l.echec,
      }),
      { total_facture: 0, sms_envoye: 0, sms_recu: 0, echec: 0 }
    )
    return NextResponse.json({ mois: brut, lignes, totaux })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
