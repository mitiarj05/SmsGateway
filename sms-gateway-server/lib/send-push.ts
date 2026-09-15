import { messaging } from './firebase-admin'

export async function sendNewTaskPush(
  fcmToken: string,
  taskId: string
): Promise<boolean> {
  if (!fcmToken) {
    console.warn('Pas de token FCM pour ce device')
    return false
  }

  try {
    await messaging.send({
      token: fcmToken,
      data: {
        action: 'new_task',
        taskId: taskId,
      },
      // Optionnel : une notification visible (mais on veut un push silencieux)
      // android: { priority: 'high' },
    })
    return true
  } catch (error) {
    console.error('Erreur envoi push FCM:', error)
    return false
  }
}