import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { fabriquerSecretNotification } from '@/lib/notifications'

/**
 * GET /api/espace/notifications/recepteur — télécharge, prêt à brancher, le
 * fichier récepteur du client : la signature (URL + secret) est déjà écrite
 * dedans. Le client ne copie que l'adresse du fichier dans Notification —
 * il ne gère jamais son secret à la main.
 * Session espace. Le secret est créé au vol si absent (ensuite le serveur
 * signera avec celui-là) : idempotent.
 */

function fabriquerRecepteurPhp(nomApplication: string, urlConnue: string | null, secret: string): string {
  const conseilUrl = urlConnue
    ? `• Vous avez déjà déclaré l'adresse : ${urlConnue}`
    : '• Après avoir déposé ce fichier, copiez son adresse complète dans votre espace → Notifications → URL.'
  return `<?php
/**
 * RÉCEPTEUR SMSTSIKA — déjà réglé, à brancher seul.
 *
 * Ce fichier a été généré dans votre espace pour l'application « ${nomApplication} ».
 * Le secret de signature est déjà dedans : vous n'avez rien à recopier.
 *
 * Les trois gestes :
 *   1. Déposez ce fichier sur votre hébergement (ex. racine du site).
 *   2. Copiez l'adresse complète du fichier, ex. https://votre-site.com/sms-recu.php,
 *      dans votre espace SMSTSIKA → Notifications → URL.
 *   3. Cliquez « Tester le webhook ». Si la livraison affiche « ENVOYE », la sonnette est branchée.
 *
 * ${conseilUrl}
 *   (si vous déposez le fichier ailleurs, changez simplement l'adresse déclarée.)
 *
 * Personnalisez ensuite la section « VOTRE ACTION » en bas : c'est elle qui
 * marquera, par exemple, une commande payée dans VOTRE base.
 */

// 1. Reconstituer la signature : HMAC-SHA256 du corps brut, avec LE secret partagé.
$http_brut = file_get_contents('php://input');
$http_signature = isset($_SERVER['HTTP_X_SMSIKA_SIGNATURE']) ? $_SERVER['HTTP_X_SMSIKA_SIGNATURE'] : '';
$http_calcule = 'sha256=' . hash_hmac('sha256', $http_brut, '${secret}');

// 2. Un intrus sans la bonne signature ne passe jamais.
if (!hash_equals($http_calcule, $http_signature)) {
    http_response_code(401);
    exit;
}

// 3. Décodage de l'événement reçu (aujourd'hui : "sms.recu" — un SMS entrant).
$evenement = json_decode($http_brut, true);
$type = isset($evenement['type']) ? $evenement['type'] : '';
$donnees = isset($evenement['donnees']) ? $evenement['donnees'] : array();
$contenu = isset($donnees['contenu']) ? $donnees['contenu'] : '';
$expediteur = isset($donnees['expediteur']) ? $donnees['expediteur'] : '';

/* ─────────────────────────  VOTRE ACTION  ─────────────────────────
 * Vous disposez ici de :
 *   $type       — l'événement ("sms.recu")
 *   $contenu    — le texte du SMS, ex. "PAYE CMD-1234"
 *   $expediteur — le numéro de l'expéditeur (ex. "+26134…")
 *
 * Exemple — marquer une commande payée dans VOTRE base (à décommenter
 * et à remplir avec votre code métier) :
 *
 * if ($type === 'sms.recu' && preg_match('/PAYE\\s*CMD[- ]?(\\d{3,6})/i', $contenu, $m)) {
 *     // $m[1] = le numéro de commande (ex. "1234")
 *     // marquerCommandePayee($m[1], $expediteur);
 * }
 * ───────────────────────────────────────────────────────────────── */

// 4. Toujours "bien reçu" : le serveur gardera sa file saine sinon (relances).
http_response_code(200);
echo 'ok';
`
}

export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('nom, url_notification, secret_notification')
      .eq('id', idApplication)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }
    const fiche = data as { nom: string; url_notification: string | null; secret_notification: string | null }

    // Secret assuré : s'il n'existe pas encore, on le fabrique une fois pour
    // toutes (le serveur signera tous les webhooks avec ce même secret).
    let secret = fiche.secret_notification ?? null
    if (!secret) {
      secret = fabriquerSecretNotification()
      const { error: erreurSecret } = await supabaseAdmin
        .from('applications')
        .update({ secret_notification: secret })
        .eq('id', idApplication)
      if (erreurSecret) {
        return NextResponse.json({ error: erreurSecret.message }, { status: 500 })
      }
    }

    const fichier = fabriquerRecepteurPhp(fiche.nom, fiche.url_notification, secret)
    return new NextResponse(fichier, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sms-recu.php"',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
