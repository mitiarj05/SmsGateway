/**
 * Statuts centralisés — miroir EXACT des enums Supabase :
 *   - statut_appareil (table appareils)
 *   - statut_message (table taches — seul le nom de la table change, l'enum reste)
 *
 * Confirmés en base (erreurs prod si valeur absente) :
 * appareils = EN_LIGNE, HORS_LIGNE, DESACTIVE (OCCUPE absent → retiré) ;
 * messages = EN_ATTENTE, RECLAME, ENVOYE, ECHOUE (PROGRAMME absent → migration SQL requise).
 * ASSIGNE : jamais écrit par le code, à confirmer via pg_enum.
 * Si une valeur diffère, UNE SEULE ligne à corriger ici.
 *
 * Le contrat JSON (noms de champs) ne change pas ; seules les valeurs
 * de statut circulent en français de bout en bout (base + API + app).
 */
export const STATUT_APPAREIL = {
  EN_LIGNE: 'EN_LIGNE',
  HORS_LIGNE: 'HORS_LIGNE',
  DESACTIVE: 'DESACTIVE',
} as const
export type StatutAppareil =
  (typeof STATUT_APPAREIL)[keyof typeof STATUT_APPAREIL]

export const STATUT_TACHE = {
  EN_ATTENTE: 'EN_ATTENTE',
  RECLAME: 'RECLAME',
  ENVOYE: 'ENVOYE',
  ECHOUE: 'ECHOUE',
  PROGRAMME: 'PROGRAMME',
  ASSIGNE: 'ASSIGNE',
} as const
export type StatutTache =
  (typeof STATUT_TACHE)[keyof typeof STATUT_TACHE]
