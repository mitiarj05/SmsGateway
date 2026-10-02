'use client'

import { BookOpen } from 'lucide-react'
import CoquilleEspace from '../../../composants/CoquilleEspace'

function Bloc({ titre, methode, chemin, children }: {
  titre: string; methode: string; chemin: string; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{titre}</h2>
      <p className="mt-2 font-mono text-xs">
        <span className={`mr-2 rounded px-1.5 py-0.5 font-bold ${methode === 'GET' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
          {methode}
        </span>
        <span className="text-zinc-600 dark:text-zinc-300">{chemin}</span>
      </p>
      <div className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{children}</div>
    </section>
  )
}

export default function PageApiEspace() {
  return (
    <CoquilleEspace titre="Documentation API" sousTitre="Intégrez vos envois à votre logiciel">
      <div className="grid max-w-5xl grid-cols-1 gap-4">
        <section className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-600/20 dark:bg-blue-500/10 dark:ring-blue-400/20">
          <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200">Authentification</h2>
          <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
            En-tête <code className="font-mono">Authorization: Bearer VOTRE_CLE</code> sur chaque appel.
            Votre clé figure dans le courriel de bienvenue (gardez-la secrète).
          </p>
        </section>

        <Bloc titre="Envoyer un SMS" methode="POST" chemin="/api/sms/send">
          <p>Corps : <code className="font-mono">to</code> (numéro ou liste), <code className="font-mono">message</code>, <code className="font-mono">cle_api</code>, optionnels <code className="font-mono">scheduled_at</code> (ISO futur), <code className="font-mono">lien_intelligent: true</code>.</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-200">{`curl -X POST https://VOTRE-DOMAINE/api/sms/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"+261340000000","message":"Bonjour {LIEN}","cle_api":"cle_...","lien_intelligent":true}'`}</pre>
          <p className="mt-2">Réponses : <code className="font-mono">201</code> file d&apos;attente (+ <code className="font-mono">liens[]</code> si lien), <code className="font-mono">401</code> clé invalide, <code className="font-mono">429</code> quota atteint, <code className="font-mono">403</code> destinataires désinscrits (<code className="font-mono">bloques[]</code>).</p>
        </Bloc>

        <Bloc titre="Suivre vos envois" methode="GET" chemin="/api/sms/status?cle_api=...&limit=50">
          <p>Réponse <code className="font-mono">tasks[]</code> : <code className="font-mono">statut</code> (<code className="font-mono">EN_ATTENTE</code>, <code className="font-mono">RECLAME</code>, <code className="font-mono">ENVOYE</code>, <code className="font-mono">ECHOUE</code>, <code className="font-mono">PROGRAMME</code>), <code className="font-mono">error_message</code>, <code className="font-mono">scheduled_at</code>. Filtres : <code className="font-mono">ids=id1,id2</code>, <code className="font-mono">since=ISO</code>.</p>
        </Bloc>

        <Bloc titre="Recevoir les événements" methode="POST" chemin="votre url_notification">
          <p>Configurez-la dans Notifications. Chaque événement arrive signé (<code className="font-mono">X-Smsika-Signature: sha256=…</code>, secret affiché une seule fois) : <code className="font-mono">sms.recu</code> (réponse reçue), <code className="font-mono">lien.clique</code> (clic, premier uniquement). Répondez <code className="font-mono">200</code>, sinon on rejoue (1′ → 5′ → 30′ → 2h → 12h).</p>
        </Bloc>

        <section className="flex items-center gap-2 text-xs text-zinc-400">
          <BookOpen className="h-4 w-4" />
          Limites : 100 destinataires/appel, quota mensuel affiché au Tableau, numéros désinscrits (STOP) ignorés.
        </section>
      </div>
    </CoquilleEspace>
  )
}
