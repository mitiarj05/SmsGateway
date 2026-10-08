/**
 * Vérification serveur du reCAPTCHA v2 (« Je ne suis pas un robot »).
 *
 * Comportement : si RECAPTCHA_SECRET_KEY est absente (dev local sans clés),
 * la vérification est ignorée avec un avertissement — jamais en aveugle en
 * production : configurez les clés pour activer le contrôle réel.
 */
export async function verifierCaptcha(
  jeton: unknown,
  ip: string | null
): Promise<{ ok: boolean; raison?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    console.warn('[captcha] RECAPTCHA_SECRET_KEY absente — contrôle ignoré (ajoutez les clés pour l\u2019activer)')
    return { ok: true }
  }
  if (typeof jeton !== 'string' || !jeton) {
    return { ok: false, raison: 'Veuillez cocher « Je ne suis pas un robot »' }
  }
  try {
    const params = new URLSearchParams({ secret, response: jeton })
    if (ip) params.set('remoteip', ip)
    const reponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const donnees = (await reponse.json().catch(() => null)) as { success?: boolean } | null
    if (donnees?.success) return { ok: true }
    return { ok: false, raison: 'Échec de la vérification anti-robot — réessayez' }
  } catch {
    return { ok: false, raison: 'Vérification anti-robot indisponible — réessayez' }
  }
}

/** La vérification est-elle réellement active (clés présentes) ? */
export function captchaActif(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY)
}
