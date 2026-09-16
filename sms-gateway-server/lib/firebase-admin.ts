import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import path from 'path'
import fs from 'fs'

/**
 * Credential Firebase Admin :
 * - en local : sms-gateway-server/firebase-service-account.json (gitignoré) ;
 * - en prod (Vercel, fichier absent) : variable FIREBASE_SERVICE_ACCOUNT_JSON
 *   contenant le JSON complet du compte de service.
 */
function loadCredential() {
  const filePath = path.join(process.cwd(), 'firebase-service-account.json')
  if (fs.existsSync(filePath)) {
    return cert(filePath)
  }
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (inline) {
    return cert(JSON.parse(inline))
  }
  throw new Error(
    'Firebase Admin non configuré : ajoutez firebase-service-account.json ' +
      'ou la variable FIREBASE_SERVICE_ACCOUNT_JSON.'
  )
}

if (!getApps().length) {
  initializeApp({ credential: loadCredential() })
}

export const messaging = getMessaging()
