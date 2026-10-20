# Boutique Tsika

**Un site client de démonstration, séparé :** une vraie boutique qui paie son SMS au prix du marché — un appel HTTP avec sa clé API pour envoyer, une URL signée pour recevoir. Elle ne partage ni base, ni code, ni compte avec la passerelle. Déployée sur son propre projet Vercel, elle finit avec son propre nom de domaine.

## Le principe (ce que la boutique « connaît »)

| Variable d'environnement | Rôle |
|---|---|
| `SMSTSIKA_URL` | L'adresse d'appel de la passerelle (défaut `https://smstsika.vercel.app`) |
| `SMSTSIKA_CLE_API` | Sa clé personnelle — pour envoyer (`POST /api/sms/send`) |
| `SMSTSIKA_SECRET` | Le secret partagé — pour vérifier qui l'appelle (webhook) |
| `SMSTSIKA_NUMERO_PAIEMENT` | (Optionnel) numéro affiché dans le SMS de confirmation |
| `BOUTIQUE_DB_URL` / `BOUTIQUE_DB_KEY` | (Optionnel) sa propre base Supabase → commandes qui survivent au redémarrage |

Sans `BOUTIQUE_DB_*`, les commandes vivent **en mémoire** : parfait pour une session de démonstration, réinitialisées après un long redémarrage de la plateforme. Pour durer, créez un projet Supabase dédié à la boutique (2 min), exécutez `bases/commandes.sql`, puis mettez l'URL + la clé service de CE projet dans les deux variables.

## Déploiement (Vercel, site séparé)

Dashboard : **Add New Project → Importer ce dépôt → Root Directory : `boutique-tsika`** (le reste du dépôt n'est pas concerné). Puis, *Settings → Environment Variables* : les 4 variables du fichier `.env.local` (généré par le script ci-dessous ; il est gitignored — jamais commité).

Puis enregistrez l'URL du récepteur :

```bash
node scripts/outils.mjs webhook https://VOTRE-BOUTIQUE.vercel.app/api/boutique
```

## Scripts (s'exécutent depuis ce dossier avec la clé de service du serveur)

```bash
node scripts/outils.mjs init             # crée/complète la fiche client « Boutique Tsika » + écrit .env.local
node scripts/outils.mjs webhook <url>    # enregistre l'URL du récepteur
node scripts/outils.mjs appareils        # liste les appareils (et à qui ils servent)
node scripts/outils.mjs lier <préfixe>   # la passerelle du téléphone sert la boutique en PLUS (bénéficiaire)
node scripts/outils.mjs rendre           # retire le bénéfice partagé
node scripts/tester-boucle.cjs           # la boucle complète hors ligne (signature, paiement, intrus)
```

### Passerelle empruntée (zéro base, zéro compte, zéro SQL)

La boutique n'a ni base, ni compte : elle envoie **avec la clé de la passerelle
qui l'héberge**, et le webhook entrant **de cette passerelle** pousse les
réponses vers son récepteur, signé avec le même secret qu'elle détient déjà.
Le téléphone reste affiché dans le Parc d'envoi de son propriétaire, comme
toujours.

```bash
node scripts/outils.mjs emprunt
```

(cette commande rend le téléphone à son propriétaire si besoin, câble le
webhook de la passerelle, et met à jour `SMSTSIKA_CLE_API` dans `.env.local` —
la même valeur est à recoller dans les variables Vercel, puis Redeploy).

## Le scénario complet (le test réel)

1. Créez une commande sur la boutique (la confirmation SMS part via la clé API).
2. Le payeur (n'importe quel téléphone) répond au même SMS : `PAYE CMD-XXXX`.
3. La passerelle capte le SMS → le routage entrant associe la réponse à qui l'avait appelée → le webhook **signé** prévient la boutique → la page passe toute seule à **« Payée »**.

## Le récepteur modèle (pour brancher un VRAI site client)

Un vrai client dépose ce genre de fichier chez lui (`sms-recu.php`), colle son secret, et adapte l'action :

```php
<?php
$brut = file_get_contents('php://input');
$calcule = hash_hmac('sha256', $brut, "SON_SECRET");
if (!hash_equals($_SERVER['HTTP_X_SMSIKA_SIGNATURE'] ?? '', "sha256={$calcule}")) {
  http_response_code(401); exit;
}
$charge = json_decode($brut, true);
$contenu = $charge['donnees']['contenu'] ?? '';
if (preg_match('/PAYE\\s*CMD[-\\s]?(\\d{3,6})/i', $contenu, $m)) {
  // SON action : marquer la commande $m[1] payée dans SA base.
}
http_response_code(200); echo 'ok';
```

## Structure

```
api/boutique.js      l'unique point d'entrée : webhook signé + commandes
lib/smstsika.js      envoyer (clé API) + vérifier la signature
lib/magasin.js       SES commandes (mémoire ou SA base propre)
index.html           la boutique (papier, encre, mobile money)
bases/commandes.sql  sa propre base (optionnelle, projet Supabase séparé)
scripts/outils.mjs   branchement / liaison du téléphone
scripts/tester-boucle.cjs  tests de la boucle hors ligne
```
