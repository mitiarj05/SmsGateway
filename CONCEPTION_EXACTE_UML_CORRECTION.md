# Conception Technique Exacte pour la Correction des Diagrammes UML — SMSTSIKA v3.0

Ce document est le guide de référence exact basé sur le **code source réel** de votre projet SMSTSIKA. Il fournit les éléments précis pour corriger vos 3 types de diagrammes :
1. **Diagramme de Séquence Système (DSS)** — Vue Boîte Noire (Acteur ↔ Système).
2. **Diagramme de Séquence de Conception (DSD)** — Vue Boîte Blanche avec les **vrais objets/méthodes du code Kotlin & Next.js**.
3. **Diagramme de Classes de Conception** — Vraies classes Kotlin, repositories, contrôleurs et schéma BDD.

---

## 📌 1. DIAGRAMMES DE SÉQUENCE SYSTÈME (DSS - Vue Boîte Noire)

En DSS, le système est une **boîte noire unique (`:Système SMSTSIKA`)**. Seules les interactions externes entre les acteurs et le système sont représentées.

### DSS 1 : Émission d'un SMS OTP / Transactionnel (Cas Sortant)
* **Acteur** : `Application Client (API)`
* **Système** : `:Système SMSTSIKA`
1. `Client` ──► `demanderEnvoiSms(cle_api, destinataire, message)` ──► `:Système SMSTSIKA`
2. `:Système SMSTSIKA` ──► `SmsMisEnFile(tache_id, statut: "EN_ATTENTE")` ──► `Client`
3. `:Système SMSTSIKA` ──► `ÉmettreSMS(destinataire, message)` ──► `Mobile Destinataire`
4. `:Système SMSTSIKA` ──► `NotifierLivraison(tache_id, statut: "LIVRE")` ──► `Client`

### DSS 2 : Réception d'un SMS & Notification Webhook (Cas Entrant)
* **Acteurs** : `Abonné Mobile GSM` (Payeur), `Système Client`
1. `Abonné Mobile GSM` ──► `EnvoyerSMS("PAYER CMD-1042")` ──► `:Système SMSTSIKA`
2. `:Système SMSTSIKA` ──► `NotificationWebhookHTTP(X-Smsika-Signature, payload)` ──► `Système Client`
3. `Système Client` ──► `Reponse200OK()` ──► `:Système SMSTSIKA`

---

## 📌 2. DIAGRAMMES DE SÉQUENCE DE CONCEPTION (DSD - Vue Boîte Blanche Technique)

Chaque ligne de vie correspond à une **vraie classe Kotlin/Next.js** et chaque flèche à une **vraie méthode du code**.

### DSD 1 : Appairage & Liaison du Téléphone par QR Code
* **Lignes de vie (Classes Kotlin Android)** :
  * `v: EcranScanQr` (Vue Compose)
  * `c: ControleurAppareils` (Contrôleur)
  * `r: DepotAppareilsImpl` (Repository)
  * `api: ClientApi` (Remote REST)
  * `srv: ServeurNextJs` (Backend API)

```
[ v: EcranScanQr ] ─── (1) lierParCode("QR_123456") ───► [ c: ControleurAppareils ]
                                                                 │
                                    (2) lierParCode(code)        │
                                                                 ▼
                                                  [ r: DepotAppareilsImpl ]
                                                                 │
                                    (3) lierParCode(code, nom)   │
                                                                 ▼
                                                  [ api: ClientApi ]
                                                                 │
                                    (4) POST /api/appareils/lier-par-code ───► [ srv: ServeurNextJs ]
                                                                                     │
                                    (5) ResultatEnregistrement.Succes ◄──────────────┘
                                                                 │
                                    (6) enregistrerIdentifiants(id, token) ───► [ PreferencesAppareil ]
```

---

### DSD 2 : Traitement et Émission d'un SMS (Cas Sortant / Outbound)
* **Lignes de vie (Classes Kotlin Android)** :
  * `fcm: ServiceFcm`
  * `c: ControleurTaches` (Contrôleur)
  * `r: DepotTachesImpl`
  * `sim: GestionnaireSim`
  * `sms: ExpediteurSms`
  * `api: ClientApi`

```
[ fcm: ServiceFcm ] ─── (1) onMessageReceived("new_task") ───► [ c: ControleurTaches ]
                                                                     │
                                  (2) recupererTaches(id, token)     │
                                                                     ▼
                                                      [ r: DepotTachesImpl ] ───► POST /tasks ───► [ Server ]
                                                                     │
                                  (3) traiterTaches(listeTaches) ◄───┘
                                                                     │
                                  (4) mettreAJourStatut(RECLAME) ────┼───► POST /status/RECLAME ─► [ Server ]
                                                                     │
                                  (5) resoudreAbonnementId() ────────┼───► [ sim: GestionnaireSim ]
                                                                     │
                                  (6) envoyerSms(num, msg, simId) ───┼───► [ sms: ExpediteurSms ]
                                                                     │             │
                                                                     │      (7) sendTextMessage() GSM
                                                                     │             │
                                  (8) marquerStatut(ENVOYE) ─────────┴─────────────┘
                                                                     │
                                  (9) confirmerAvecReessai(ENVOYE) ──┼───► POST /status/ENVOYE ──► [ Server ]
```

---

### DSD 3 : Réception d'un SMS & Transfert Inbound (Cas Entrant)
* **Lignes de vie (Classes Kotlin Android)** :
  * `rec: RecepteurSms` (BroadcastReceiver)
  * `journal: JournalEvenements`
  * `api: ClientApi`
  * `srv: ServeurNextJs`

```
[ Antenne GSM ] ─── (1) Intent SMS_RECEIVED ───► [ rec: RecepteurSms ]
                                                         │
                                    (2) extrairePdu()    │
                                                         ▼
                                    (3) envoyerEntrant(exp, contenu, date)
                                                         │
                                                         ▼
                                                [ api: ClientApi ]
                                                         │
                                    (4) POST /api/devices/[id]/inbox ───► [ srv: ServeurNextJs ]
                                                                                   │
                                    (5) INSERT INTO reponse ───────────────────────┤
                                                                                   │
                                    (6) enfilerNotification('sms.recu') ───────────┤
                                                                                   │
                                    (7) POST Webhook (Signature HMAC-SHA256) ──────┼───► [ Client Web ]
```

---

### DSD 4 : Relevé de Solde SIM par Code USSD
* **Lignes de vie (Classes Kotlin Android)** :
  * `c: ControleurSoldeSim` (Contrôleur)
  * `tel: TelephonyManager`
  * `api: ClientApi`

```
[ ServicePasserelleSms ] ─── (1) executerVerificationSolde() ───► [ c: ControleurSoldeSim ]
                                                                          │
                                     (2) sendUssdRequest("*111#")         │
                                                                          ▼
                                                         [ tel: TelephonyManager ]
                                                                          │
                                     (3) onReceiveUssdResponse(texte) ───►│
                                                                          │
                                     (4) parserSolde(texte)               │
                                                                          │
                                     (5) POST /api/devices/[id]/solde-sim ┼───► [ Server ]
```

---

## 📌 3. DIAGRAMME DE CLASSES DE CONCEPTION (Class Diagram)

### A. Vraies Classes Kotlin Android (`com.mitia.smsgateway.*`)

#### 1. Les 5 Contrôleurs (`controller/`)
* **`ControleurAppareils`** :
  * `+ assurerEnregistrement(): Pair<String, String>?`
  * `+ connecterAnonymement(): String?`
  * `+ actualiserJetonFcm(appareilId: String, jeton: String): Void`
* **`ControleurTaches`** :
  * `+ traiterTaches(context: Context, appareilId: String, jeton: String, liste: List<TacheDto>, notify: (String)->Unit): Void`
* **`ControleurLivraisons`** :
  * `+ traiterLivraison(context: Context, tacheId: String, codeRetour: Int): Void`
* **`ControleurConfirmationsEnAttente`** :
  * `+ rejouerConfirmationsEnAttente(appareilId: String, jeton: String): Void`
* **`ControleurSoldeSim`** :
  * `+ executerVerificationSolde(context: Context): Void`
  * `+ parserReponseSolde(texte: String): InfoSolde`

#### 2. Moteur SMS & Telephonie (`data/sms/`)
* **`ExpediteurSms`** :
  * `+ envoyerSms(context: Context, numero: String, message: String, abonnementId: Int): Boolean`
* **`GestionnaireSim`** :
  * `+ listerSims(context: Context): List<InfoSim>`
  * `+ resoudreAbonnementId(context: Context): Int`
  * `+ noterEnvoi(context: Context): Void`

#### 3. Repositories & API (`data/repository/` & `data/remote/`)
* **`DepotAppareilsImpl`** :
  * `+ obtenirIdentifiants(): Pair<String, String>?`
  * `+ enregistrer(nom: String, jetonId: String): ResultatEnregistrement`
  * `+ lierParCode(code: String): ResultatEnregistrement`
* **`DepotTachesImpl`** :
  * `+ recupererTaches(appareilId: String, jeton: String): ResultatTaches`
  * `+ mettreAJourStatutDetaille(appareilId, jeton, tacheId, statut): ResultatStatut`
  * `+ confirmerAvecReessai(appareilId, jeton, tacheId, statut): Boolean`
* **`ClientApi`** :
  * `+ enregistrerAppareil(nom, jetonId, androidId): ResultatEnregistrement`
  * `+ lierParCode(urlServeur, code, nom, androidId, jetonId): ResultatEnregistrement`
  * `+ obtenirTachesDetaillees(appareilId, jeton): ResultatTaches`
  * `+ mettreAJourStatutTacheDetaille(appareilId, jeton, tacheId, statut): ResultatStatut`
  * `+ envoyerEntrant(context, appareilId, jeton, expediteur, contenu, date): Boolean`

---

### B. Modèle de Données PostgreSQL Supabase (Tables BDD)

```
┌────────────────────────────────────────────────────────┐
│                        client                          │
├────────────────────────────────────────────────────────┤
│ id : uuid [PK]                                         │
│ nom : text                                             │
│ email : text                                           │
│ cle_api : text [Unique]                                │
│ url_application : text [Nullable]                      │
│ secret_signature : text [Nullable]                     │
│ evenements_souscrits : text[]                          │
│ evenements_actifs : boolean                            │
│ quota_mensuel : integer [Nullable]                     │
│ user_id : uuid [FK -> auth.users.id]                   │
│ firebase_uid : text [FK]                               │
└────────────────────────────────────────────────────────┘
                           │ 1
                           │
                           │ 0..*
┌────────────────────────────────────────────────────────┐
│                        appareil                        │
├────────────────────────────────────────────────────────┤
│ id : uuid [PK]                                         │
│ nom : text                                             │
│ jeton : text [Unique]                                  │
│ statut : text (EN_LIGNE / HORS_LIGNE / DESACTIVE)      │
│ jeton_fcm : text [Nullable]                            │
│ android_id : text                                      │
│ derniere_synchro : timestamptz                         │
│ sms_envoyes_heure : integer                            │
│ solde_sim : text [Nullable]                            │
│ id_application : uuid [FK -> client.id]                │
└────────────────────────────────────────────────────────┘
                           │ 1
                           │
                           │ 0..*
┌────────────────────────────────────────────────────────┐
│                         tache                          │
├────────────────────────────────────────────────────────┤
│ id : uuid [PK]                                         │
│ numero_destinataire : text                             │
│ contenu : text                                         │
│ statut : text (EN_ATTENTE/RECLAME/ENVOYE/ECHOUE)       │
│ livraison : text [Nullable] (LIVRE/ECHEC_LIVRAISON)    │
│ livre_le : timestamptz [Nullable]                      │
│ date_creation : timestamptz                            │
│ id_application : uuid [FK -> client.id]                │
│ id_appareil : uuid [FK -> appareil.id]                 │
└────────────────────────────────────────────────────────┘
```
