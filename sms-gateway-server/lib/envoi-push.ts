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
      // Priorité haute : le téléphone doit se réveiller MAINTENANT, même en
      // sommeil — sans elle, Android livre le message « quand il peut » et
      // la tâche n'atterrit sur le téléphone que par la scrutation de 30 s.
      android: { priority: 'high', ttl: 300000 },
    })
    return true
  } catch (erreur) {
    console.error('Erreur envoi push FCM:', erreur)
    return false
  }
}