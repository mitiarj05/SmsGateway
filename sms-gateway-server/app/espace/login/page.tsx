'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, AlertTriangle, ArrowRight } from 'lucide-react'

function destinationSure(brute: string | null): string {
  if (brute && brute.startsWith('/espace') && !brute.startsWith('//')) return brute
  return '/espace'
}

/** Connexion à l'espace client avec la clé API (cle_...). */
export default function PageConnexionEspace() {
  const routeur = useRouter()
  const [cleApi, setCleApi] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [destination, setDestination] = useState('/espace')

  useEffect(() => {
    setDestination(destinationSure(new URLSearchParams(window.location.search).get('next')))
  }, [])

  async function gererSoumission(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    try {
      const reponse = await fetch('/api/espace/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle_api: cleApi.trim() }),
      })
      const donnees = await reponse.json().catch(() => null)
      if (!reponse.ok) {
        setErreur(donnees?.error ?? 'Clé API invalide')
        return
      }
      routeur.replace(destination)
    } catch {
      setErreur('Impossible de joindre le serveur')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/smsika.png" alt="SMSIKA" width={40} height={40} className="rounded-xl" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">SMSIKA</p>
            <p className="text-xs text-zinc-400">Espace client</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Connexion</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Espace <span className="font-semibold text-zinc-600 dark:text-zinc-300">client</span> — utilisez la clé API transmise par votre administrateur.
          </p>
        {erreur && (
          <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {erreur}
          </div>
        )}
        <form onSubmit={gererSoumission} className="mt-6 space-y-4">
          <div>
            <label htmlFor="cleApi" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Clé API
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="cleApi"
                type="password"
                required
                autoComplete="off"
                placeholder="cle_…"
                value={cleApi}
                onChange={(e) => setCleApi(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={chargement}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {chargement ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Se connecter <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>
          <p className="mt-8 text-center text-xs text-zinc-400">
            Pas encore de clé ?{' '}
            <Link href="/demande-acces" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Demandez l&apos;accès
            </Link>
            <br />
            <span className="mt-1 inline-block">
              Vous êtes administrateur ?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Connexion admin
              </Link>
            </span>
          </p>
      </div>
    </div>
  )
}
