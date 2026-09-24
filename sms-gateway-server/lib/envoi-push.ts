import { messagerie } from './firebase-admin'

export async function envoyerPushNouvelleTache(
  jetonFcm: string,
  idTache: string
): Promise<boolean> {
  if (!jetonFcm) {
    console.warn('Pas de token FCM pour cet appareil')
    return false
  }

  try {
    await messagerie.send({
      token: jetonFcm,
      data: {
        action: 'new_task',
        tacheId: idTache,
      },
      // Optionnel : une notification visible (mais on veut un push silencieux)
      // android: { priority: 'high' },
    })
    return true
  } catch (erreur) {
    console.error('Erreur envoi push FCM:', erreur)
    return false
  }
}