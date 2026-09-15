import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import path from 'path'

if (!getApps().length) {
  initializeApp({
    credential: cert(
      path.join(process.cwd(), 'firebase-service-account.json')
    ),
  })
}

export const messaging = getMessaging()
