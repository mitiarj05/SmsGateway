# 📋 Résumé des changements — SMSTSIKA

Ce document récapitule l'ensemble des modifications apportées au projet SMSTSIKA (passerelle SMS + site web + espace client) dans le cadre de la simplification continue, de la réorganisation de la base de données et de l'unification du vocabulaire.

---

## 1. Réorganisation de la base de données (singulier)

### Tables renommées (pluriel → singulier)
| Ancien nom | Nouveau nom |
|------------|-------------|
| `applications` | `client` |
| `appareils` | `appareil` |
| `taches` | `tache` |
| `parametres` | `parametre` |
| `reponses` | `reponse` |
| `notifications` | `notification` |
| `demandes` | `demande` |

### Colonnes mortes purgées (forfait illimité — seul crédit = la SIM)
| Table | Colonne supprimée |
|-------|-------------------|
| `client` | `quota_mensuel` |
| `appareil` | `sms_envoyes_heure` |
| `facturation` | `clics` |

### Colonnes d'intégration renommées (table `client`)
| Ancien nom | Nouveau nom |
|------------|-------------|
| `url_notification` | `url_application` |
| `secret_notification` | `secret_signature` |
| `evenements_notification` | `evenements_souscrits` |
| `notifications_actives` | `evenements_actifs` |

### Bloc de renommage auto dans `schema.sql`
Chaque renommage de colonne est protégé par un `DO $$` qui vérifie l'existence de l'ancienne colonne et l'absence de la nouvelle avant d'exécuter `RENAME COLUMN`. Le fichier `schema.sql` est **idempotent** (réexécutable sans risque) et se termine par `NOTIFY pgrst, 'reload schema';`.

---

## 2. Vocabulaire UI — "Notifications" → "Intégrations"

L'espace client utilise désormais le vocabulaire "Intégrations" pour la gestion des liens avec les boutiques clients (WooCommerce, Shopify, etc.) et des événements. La cloche de notifications en haut à droite reste étiquetée "Notifications" (alertes d'interface) et n'est PAS renommée.

### Textes modifiés
| Endroit | Avant | Après |
|---------|-------|-------|
| Menu latéral espace | Notifications | Intégrations |
| Fil d'Ariane | Espace > Notifications | Espace > Intégrations |
| Titre page | Connexion Boutique & Webhooks | Connexion de votre boutique |
| Sous-titre | URL de Webhook personnalisée | lien de votre application |
| Carte verte | les notifications partent vers | les événements sont envoyés vers |
| Carte manuelle | Configuration Manuelle Webhook HTTP POST | Configuration manuelle du lien |
| Libellé champ | URL de Webhook personnalisée | Lien de votre application |
| Toggle | Notifications actives | Événements actifs |
| Bouton test | Tester le webhook | Tester le lien |
| Journal | Dernières livraisons webhook | Dernières livraisons d'événements |
| Guide public | section Notifications | section Intégrations |
| Guide public | Tester le webhook | Tester le lien |
| Recepteur PHP | Notifications → URL | Intégrations → URL |

### Adresse webhook préservée
L'adresse `https://.../wp-json/smsika/v1/webhook` (ou `/api/boutique`) est **inchangée** dans le code et dans les données. Seul le texte affiché à l'utilisateur change.

---

## 3. Renommage de la table `notification` → `evenement`

La table de file des événements sortants a été renommée pour cohérence avec le nouveau vocabulaire.

### Fichiers modifiés
- `lib/notifications.ts` → toutes les requêtes `.from('notification')` deviennent `.from('evenement')`
- `app/api/espace/journal/route.ts` → `.from('evenement')`
- `app/api/notifications/route.ts` → `.from('evenement')`
- `supabase/schema.sql` :
  - Bloc de renommage `livraisons_webhook` / `notifications` / `notification` → `evenement`
  - Table `CREATE TABLE IF NOT EXISTS evenement` (remplace `notification`)
  - Index `idx_evenement_due` (remplace `idx_notification_due`)
  - Colonne `dernier_code_http` supprimée de `evenement`
  - Policies RLS renommées (`evenement_all_own`)
  - `evenement` ajouté à la boucle RLS

### SQL d'exécution sur la base existante
```sql
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evenement') THEN
    ALTER TABLE public.notification RENAME TO evenement;
    ALTER INDEX IF EXISTS idx_notification_due RENAME TO idx_evenement_due;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
```

### Table `evenement` en doublon
Si votre base contient déjà les deux tables `notification` et `evenement`, supprimez `notification` :
```sql
DROP TABLE IF EXISTS public.notification;
```

---

## 4. Renommage des dossiers et fichiers

| Avant | Après |
|-------|-------|
| `app/espace/notifications/page.tsx` | `app/espace/evenements/page.tsx` |
| `app/api/espace/notifications/route.ts` | `app/api/espace/evenements/route.ts` |
| `app/api/espace/notifications/recepteur/route.ts` | `app/api/espace/evenements/recepteur/route.ts` |
| `lib/notifications.ts` | `lib/evenements.ts` |

Les imports et liens internes ont été mis à jour (`@/lib/notifications` → `@/lib/evenements`, `/api/espace/notifications` → `/api/espace/evenements`, etc.).

---

## 5. Suppression des "Demandes d'accès"

Toute la mécanique de demande d'accès (attente de validation admin) a été retirée. L'inscription est désormais directe.

### Fichiers supprimés
- `app/api/demandes/route.ts`
- `app/api/demandes/[id]/valider/route.ts`
- `app/api/demandes/[id]/refuser/route.ts`
- `app/demande-acces/page.tsx`

### Fichiers modifiés
- `app/settings/page.tsx` : suppression de la section "Demandes d'accès", du fetch associé, de la fonction `traiterDemande` et de l'import `UserPlus`
- `lib/compte-client.ts` : suppression de toute la logique de lecture/écriture sur la table `demande` (les fonctions `obtenirOuCreerApplication` et `obtenirOuCreerParFirebase` ne consultent plus cette table)
- `supabase/schema.sql` : suppression de la table `demande`, de l'index `idx_demande_statut`, du bloc de renommage `demandes` → `demande`, et de `demande` de la boucle RLS

### SQL d'exécution sur la base existante
```sql
DROP TABLE IF EXISTS public.demande;
```

---

## 6. Nouvelle page d'inscription client (`/inscription`)

### Fichiers créés
- `app/inscription/page.tsx` — écran d'inscription en 2 étapes
- `app/api/auth/inscription/verifier/route.ts` — vérification du code 6 chiffres

### Fichiers modifiés
- `app/api/auth/inscription/route.ts` — crée l'utilisateur Supabase (email non confirmé), génère un code à 6 chiffres, l'envoie par email, renvoie `{ code_envoye: true }`
- `app/api/auth/google/retour/route.ts` — supporte `finalite=inscription` (redirige vers `/espace` après succès OAuth)
- `app/login/page.tsx` — le lien "S'inscrire" pointe désormais vers `/inscription` au lieu de `/demande-acces`
- `supabase/schema.sql` — ajoute la table `validation` (code 6 chiffres, validité 15 min)

### Flux d'inscription
1. Formulaire : nom, e-mail, mot de passe (≥8 car.), confirmation, reCAPTCHA
2. Soumission → création utilisateur Supabase + envoi du code par email
3. Étape vérification : saisie du code 6 chiffres → confirmation email + création application client + session cookie → redirection `/espace`
4. Bouton "Renvoyer le code" disponible
5. Lien "Déjà un compte ? Se connecter" → `/login`

### SQL pour la table `validation`
```sql
CREATE TABLE IF NOT EXISTS validation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  user_id uuid NOT NULL,
  nom text NOT NULL DEFAULT '',
  expire_le timestamptz NOT NULL,
  tentatives integer NOT NULL DEFAULT 0,
  date_creation timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT validation_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_validation_email ON validation (email);
```

---

## 7. Suppression de la page "Mon compte" (`/espace/moi`)

Le contenu de la page "Mon compte" a été fusionné dans la page **Paramètres** de l'espace client.

### Fichier supprimé
- `app/espace/moi/page.tsx`

### Fichiers modifiés
- `app/espace/parametres/page.tsx` : ajoute les cartes "Votre clé d'API" (avec copie) et "Statistiques du mois" (envoyés, en attente, échoués, reçus, utilisation du mois)
- `composants/CoquilleEspace.tsx` : retrait de l'entrée menu "Mon compte" et de l'icône `User`
- `app/espace/sommaire/page.tsx` : retrait de l'entrée "Mon compte" et de l'import `User`

L'API `/api/espace/moi` (GET et PATCH) reste active et alimente les données affichées dans Paramètres.

---

## 8. Corrections diverses

| Problème | Correction |
|----------|------------|
| Lien menu Intégrations pointait vers l'API (`/api/espace/evenements`) | Corrigé vers la page (`/espace/evenements`) |
| Lien sommaire Intégrations pointait vers l'API | Corrigé vers `/espace/evenements` |
| Carte "Boutique connectée" ne s'affichait que si l'URL contenait `/wp-json/` | Affichée dès qu'un lien est configuré (quel qu'il soit) |
| Onglet "Configuration avancée" pas sélectionné par défaut | Devient l'onglet par défaut sur la page Intégrations |
| Colonnes miroir `reponse.statut_notification` / `tentatives_notification` manquantes | Ajoutées dans `schema.sql` (`ALTER TABLE reponse ADD COLUMN IF NOT EXISTS ...`) ; le vocabulaire choisi est resté `…_notification` après arbitrage |

---

## 9. Fichiers créés au total

1. `app/inscription/page.tsx`
2. `app/api/auth/inscription/verifier/route.ts`
3. `app/espace/parametres/page.tsx` (modifié — contenu clé API + stats)
4. `supabase/schema.sql` (modifié — table validation, colonnes miroir, etc.)

## 10. Fichiers supprimés au total

1. `app/espace/moi/page.tsx`
2. `app/api/demandes/route.ts`
3. `app/api/demandes/[id]/valider/route.ts`
4. `app/api/demandes/[id]/refuser/route.ts`
5. `app/demande-acces/page.tsx`

## 11. Comment tester le parcours complet

1. **Inscription par e-mail** : `/inscription` → formulaire → code 6 chiffres par email → validation → `/espace`
2. **Code invalide / expiré** → message d'erreur approprié, "Renvoyer le code"
3. **E-mail déjà utilisé** → "Un compte existe déjà avec cet e-mail — connectez-vous."
4. **Inscription par Google** → bouton "Continuer avec Google" → OAuth → `/espace`
5. **Déjà connecté** → redirection automatique vers `/espace`
6. **Espace → Paramètres** → clé API + statistiques visibles
7. **Espace → Intégrations** → lien de l'application, événements, test, récepteur

---

## 12. Prérequis environnement

- **SMTP** configuré (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`) pour l'envoi des codes de vérification par email
- **reCAPTCHA** configuré (`RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) pour la validation anti-robot
- **Supabase** configuré (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

---

## 13. Point au 6 novembre 2026 — écrans consolidés, vocabulary figé, UML

### 13.1 État du vocabulaire (définitif — v3, aligné sur la base réelle)

| Notion | Nom retenu | Où |
|--------|------------|----|
| File des livraisons vers le site client | `evenement` (table + API + dossier) | DB, code |
| Miroir du statut de livraison sur `reponse` | **`statut_notification` / `tentative_notification`** (arbitrage utilisateur après aller-retour) | DB, code |
| Codes d'inscription à 6 chiffres | `validation` | DB, code |
| Liens vers le propriétaire | `id_client` partout (appareil, tache, reponse, evenement, facturation) · `id_utilisateur` (client, validation) | DB, code |
| Événements souscrits / actifs (client) | `evenement_souscrit` / `evenement_actif` (singulier) | DB, code |
| Identité Firebase du téléphone | `firebase_uid` (appareil ; client garde son propre `firebase_uid`) | DB, code |
| Compteurs d'essai | `tentative` (singulier) sur `evenement`, `validation`, `tentative_notification` sur `reponse` | DB, code |
| Horodatage de mise à jour | `date_modification` (evenement, facturation, parametre) | DB, code |
| Facturation | `sms_envoye`, `sms_recu`, `echec` (singulier) | DB, code |
| Enum du statut d'envoi | `statut_tache` (ex `statut_message`) | DB |
| Symboles `lib/evenements.ts` | `enfilerEvenement`, `signerEvenement`, `traiterEvenementsEnAttente`, `miroirStatutEvenement`, `EVENEMENTS_DISPONIBLES`, `fabriquerSecretSignature` | code |

### 13.2 Interfaces de l'espace client (état actuel)

- **Paramètres** (`/espace/parametres`) = 2 onglets internes : « Profil & sécurité » (profil, clé API, statistiques, mot de passe) et « **Paramètres avancés** » (toute l'ancienne Intégrations : Auto-Connect, lien manuel, événements souscrits, test, récepteur, journal des livraisons). Accès direct via `/espace/parametres?onglet=avancee`.
- **« Mon compte », « Intégrations » et « Sommaire » n'existent plus** en pages séparées — le menu ne garde que « Tableau de bord / Parc d'envoi / Envoyer un SMS / Mes envois / SMS reçus / Facturation / Paramètres ». La carte « Statistiques du mois » a été retirée de Paramètres (doublon de Facturation) ; `/api/espace/moi` garde ses stats pour le tableau de bord et le badge du menu.
- L'API `/api/espace/evenements`, `/api/espace/journal`, le récepteur PHP et `connect-store` sont inchangés.
- **Nettoyage par interface (nov. 2026)** : suppression de `EcranIntegration.kt` (380 lignes, écran Android jamais routé — réellement mort) et libellé menu admin « Facturation et quotas » → « Facturation » (`ee0428c`). Candidats restants constatés mais non retenus : `/espace/sommaire` (doublon menu, demande utilisateur), carte « Statistiques du mois » de Paramètres (doublon Facturation), chaîne quota horaire (feature vivante : garde anti-saturation SIM, serveur + Android `/api/devices/[id]/quota`).
- **Page admin `/devices` clarifiée (`aaaa8db`)** : la page montre la flotte GLOBALE (tous clients confondus) — désormais assumé. Embed `client(nom)` dans `GET /api/devices`, mention « Client : … » sur chaque carte d'appareil, recherche par nom de client possible, textes réécrits honnêtes (« Flotte globale de la passerelle »).
- **Carte appareil admin — actions réelles (`756a79d`)** : le menu « ⋯ » est remplacé par 4 boutons — **Réveiller** (POST `/api/devices/[id]/ping`, push FCM test, désactivé sans jeton), **Éditer** (renommage : `nom` accepté par PATCH `/api/devices/[id]`, modale inline), **Envois** (lien `/history?appareil=<id>` : filtre + bannière sur Historique, export CSV respecte `appareil=`), **Supprimer** (dialogue de confirmation existant). Plus le **filtre par client** demandé : sélecteur « Tous les clients / <client> / Sans client » au-dessus de la flotte, compteur « X affichés sur Y ».
- **Refonte visuelle console + espace (`1493599`)** : fond gris clair (`bg-stone-100`) pour que les cartes blanches ressortent · ombres `shadow-card` adoucies et angles `rounded-2xl` partout · les 12 grands panneaux violets (`from-[#332c75]`) remplacés par des cartes blanches bordées (badges clairs, actions bleues, alertes orange clair) · nav active = fond bleu léger (`bg-[#2563EB]/10`) aussi en mobile · fiche téléphone admin compacte (identité + activité + solde regroupés, grand vectoriel supprimé) · « Journal du jour » → « **Dernières activités** » avec temps relatif fidèle (« il y a 3 h », date si plus vieux) · badge « Services stables » → « **X appareil(s) en ligne** » (compteur réel des deux coquilles, dot rouge si 0 / incident).

### 13.3 Diagrammes UML (nouveau)

- Les ~130 fichiers `.vpp` / `.bak` de la racine ont été supprimés **et enregistrés dans git** (embarqués lors du balayage vers `8109b42`, poussés sur `deploy`).
- Les diagrammes sont consolidés dans **`Diagramme/SMSTSIKA.vpp`** (5,3 Mo, avec sauvegardes `.bak_*` locales non suivies).
- Nouveau guide de correction rédigé par l'utilisateur : **`CONCEPTION_EXACTE_UML_CORRECTION.md`** (+ `.html`) — 3 familles de diagrammes (DSS boîte noire, DSD boîte blanche avec vraies classes Kotlin/Next.js, diagramme de classes).
- ⚠️ Points du guide à corriger pour coller au code réel :
  1. Table `client` : `quota_mensuel` **n'existe plus** (forfait illimité).
  2. Table `appareil` : `sms_envoyes_heure` supprimé ; le vrai nom est **`derniere_activite`** (pas `derniere_synchro`) ; il manque `uid_firebase`, `solde_devise`, `solde_texte`, `solde_maj_le`.
  3. Table `tache` : il manque `message_erreur`, `reclame_a`, `programme_a`, `livraison_code`.
  4. Le modèle ne couvre que 3 tables : il manque **`reponse`** (avec le miroir `statut_notification`/`tentatives_notification`), **`evenement`** (la file), **`facturation`**, **`parametre`**, **`validation`** (codes d'inscription).
  5. DSD 3 : `enfilerNotification('sms.recu')` → le code dit maintenant **`enfilerEvenement(...)`**.
  6. DSS 2 : « NotificationWebhookHTTP » peut rester en boîte noire, mais si renommage souhaité : `LivrerEvenement(X-Smsika-Signature, payload)`.
  7. Les classes Kotlin listées (5 contrôleurs, `ExpediteurSms`, `GestionnaireSim`, `DepotAppareilsImpl`, `DepotTachesImpl`, `ClientApi`) et la route `POST /api/appareils/lier-par-code` sont **exactes** — vérifiées dans le code.

---

*Généré automatiquement lors de la session de refactorisation SMSTSIKA — dernière mise à jour : 6 novembre 2026.*