'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react'
import BarreAccueil from '../accueil/BarreAccueil'
import PiedAccueil from '../accueil/PiedAccueil'

type EtapeOtp = 'saisie' | 'verification' | 'succes'
type EtapeCommande = 'panier' | 'attente' | 'succes'

const CARTE =
  'rounded-2xl border border-[#1C1917]/10 bg-white shadow-[0_24px_60px_-30px_rgba(28,25,23,0.35)]'
const ETIQUETTE = 'font-mono text-[11px] font-bold uppercase tracking-[0.18em]'
const BOUTON_PRINCIPAL =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50'
const BOUTON_SECONDAIRE =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#1C1917]/15 bg-white px-5 py-3 text-[13px] font-bold text-[#1C1917] transition hover:bg-[#1C1917]/5'
const CHAMP =
  'w-full rounded-lg border border-[#1C1917]/15 bg-white px-4 py-3 font-mono text-[15px] text-[#1C1917] outline-none transition placeholder:text-stone-400 focus:border-[#2563EB]'

function Alerte({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-[#B91C1C]/25 bg-[#B91C1C]/[0.05] px-3 py-2 text-[13px] font-medium text-[#B91C1C]">
      {children}
    </p>
  )
}

export default function DemoClient({ numeroPasserelle }: { numeroPasserelle: string | null }) {
  const [onglet, setOnglet] = useState<'otp' | 'commande'>('otp')

  // Module 1 — SMS sortant (code de vérification)
  const [numero, setNumero] = useState('')
  const [etapeOtp, setEtapeOtp] = useState<EtapeOtp>('saisie')
  const [codeSaisi, setCodeSaisi] = useState('')
  const [chargementOtp, setChargementOtp] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [passerelle, setPasserelle] = useState<string | null>(null)
  const [codeSecours, setCodeSecours] = useState<string | null>(null)
  const [compteur, setCompteur] = useState(0)
  const [statutEnvoi, setStatutEnvoi] = useState<{ statut: string; envoye: boolean } | null>(null)

  // Module 2 — SMS entrant (paiement d'une commande)
  const [etapeCommande, setEtapeCommande] = useState<EtapeCommande>('panier')
  const [reference, setReference] = useState('')
  const [smsRecu, setSmsRecu] = useState<{ expediteur: string; contenu: string; date_reception: string } | null>(null)
  const [copie, setCopie] = useState(false)
  const timerPoll = useRef<ReturnType<typeof setInterval> | null>(null)

  // Décompte du renvoi de code
  useEffect(() => {
    if (etapeOtp !== 'verification' || compteur <= 0) return
    const t = setInterval(() => setCompteur((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [etapeOtp, compteur])

  // Le SMS de paiement est guetté côté serveur : l'écran se met à jour seul.
  useEffect(() => {
    if (etapeCommande !== 'attente' || !reference) return
    timerPoll.current = setInterval(async () => {
      try {
        const reponse = await fetch('/api/demo/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        })
        const donnees = await reponse.json()
        if (donnees.paye && donnees.sms) {
          setSmsRecu(donnees.sms)
          setEtapeCommande('succes')
          if (timerPoll.current) clearInterval(timerPoll.current)
        }
      } catch (e) {
        console.error('Vérification du paiement impossible :', e)
      }
    }, 3000)

    return () => {
      if (timerPoll.current) clearInterval(timerPoll.current)
    }
  }, [etapeCommande, reference])

  async function demanderCode() {
    const propre = numero.trim()
    if (propre.replace(/\D/g, '').length < 8) {
      setErreur('Entrez un numéro de téléphone valide (au moins 8 chiffres).')
      return
    }
    setChargementOtp(true)
    setErreur(null)
    try {
      const reponse = await fetch('/api/demo/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: propre }),
      })
      const donnees = await reponse.json()
      if (!reponse.ok) {
        setErreur(donnees.error ?? 'L’envoi du SMS a échoué.')
        return
      }
      setNumero(donnees.numero ?? propre)
      setPasserelle(donnees.passerelle ?? null)
      setCodeSecours(donnees.code_demo_debug ?? null)
      setEtapeOtp('verification')
      setCodeSaisi('')
      setStatutEnvoi(null)
      setCompteur(60)
    } catch {
      setErreur('Erreur réseau : le serveur n’a pas répondu.')
    } finally {
      setChargementOtp(false)
    }
  }

  async function validerCode() {
    if (!/^\d{6}$/.test(codeSaisi.trim())) {
      setErreur('Le code comporte 6 chiffres.')
      return
    }
    setChargementOtp(true)
    setErreur(null)
    try {
      const reponse = await fetch('/api/demo/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, code: codeSaisi.trim() }),
      })
      const donnees = await reponse.json()
      if (!reponse.ok || !donnees.valide) {
        setErreur(donnees.error ?? 'Code incorrect.')
        return
      }
      setStatutEnvoi({ statut: donnees.envoi ?? '', envoye: donnees.envoye === true })
      setEtapeOtp('succes')
    } catch {
      setErreur('Erreur réseau : le serveur n’a pas répondu.')
    } finally {
      setChargementOtp(false)
    }
  }

  function recommencerOtp() {
    setEtapeOtp('saisie')
    setCodeSaisi('')
    setErreur(null)
    setCodeSecours(null)
    setStatutEnvoi(null)
    setCompteur(0)
  }

  async function copierInstruction() {
    try {
      await navigator.clipboard.writeText(`PAYER ${reference}`)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setCopie(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <style>{`a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible{outline:2px solid #1D4ED8;outline-offset:2px;border-radius:8px}`}</style>
      <BarreAccueil />

      <main>
        {/* En-tête */}
        <section className="border-b border-[#1C1917]/10">
          <div className="mx-auto max-w-3xl px-6 pb-10 pt-14 text-center lg:px-8">
            <p className={`${ETIQUETTE} text-[#1D4ED8]`}>
              <span className="mr-2 inline-block h-2 w-2 bg-[#1D4ED8] align-middle" aria-hidden />
              Démonstration en direct
            </p>
            <h1 className="mx-auto mt-5 max-w-2xl text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
              Essayez la passerelle avec vos vrais SMS.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-stone-600">
              Aucune simulation : le message part réellement par le téléphone que vous
              avez branché. Entrez votre numéro, recevez le SMS, saisissez le code.
            </p>

            <div className="mt-8 inline-flex rounded-xl border border-[#1C1917]/10 bg-white p-1">
              <button
                type="button"
                onClick={() => setOnglet('otp')}
                aria-pressed={onglet === 'otp'}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition ${
                  onglet === 'otp' ? 'bg-[#2563EB] text-white' : 'text-stone-600 hover:text-[#1C1917]'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Code par SMS
              </button>
              <button
                type="button"
                onClick={() => setOnglet('commande')}
                aria-pressed={onglet === 'commande'}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition ${
                  onglet === 'commande' ? 'bg-[#2563EB] text-white' : 'text-stone-600 hover:text-[#1C1917]'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                Commande payée par SMS
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
          {/* ================= MODULE 1 — SMS SORTANT ================= */}
          {onglet === 'otp' && (
            <div className={`${CARTE} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1C1917]/10 pb-5">
                <div>
                  <p className={`${ETIQUETTE} text-[#1D4ED8]`}>SMS sortant</p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                    Recevoir un code de vérification
                  </h2>
                  <p className="mt-1 text-[13.5px] text-stone-600">
                    Le code est fabriqué sur le serveur, envoyé par la SIM de la passerelle.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB]/10 px-3 py-1 text-[11px] font-bold text-[#1D4ED8]">
                  <Send className="h-3.5 w-3.5" /> Vers l’opérateur
                </span>
              </div>

              {etapeOtp === 'saisie' && (
                <div className="mx-auto max-w-lg space-y-5 pt-6">
                  <div className="space-y-2">
                    <label htmlFor="numero" className="block text-[13.5px] font-semibold">
                      Votre numéro de téléphone
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-[#1C1917]/10 bg-[#F7F5F0] px-3 py-3 font-mono text-[13px] text-stone-500">
                        +261
                      </span>
                      <input
                        id="numero"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="034 00 000 00"
                        className={CHAMP}
                      />
                    </div>
                    <p className="text-[12.5px] text-stone-500">
                      Vous pouvez aussi écrire <span className="font-mono">+261340000000</span>.
                    </p>
                  </div>

                  {erreur && <Alerte>{erreur}</Alerte>}

                  <button type="button" onClick={demanderCode} disabled={chargementOtp} className={`${BOUTON_PRINCIPAL} w-full`}>
                    {chargementOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Recevoir mon code par SMS
                      </>
                    )}
                  </button>

                  <p className="text-center text-[12px] text-stone-500">
                    Chaque essai consomme un vrai SMS sur la SIM de la passerelle.
                  </p>
                </div>
              )}

              {etapeOtp === 'verification' && (
                <div className="mx-auto max-w-lg space-y-5 pt-6">
                  <div className="rounded-lg border border-[#2563EB]/20 bg-[#2563EB]/[0.05] px-4 py-3 text-[13px]">
                    <p className="font-semibold">
                      Le SMS part vers <span className="font-mono">{numero}</span>
                      {passerelle ? <> via <span className="font-semibold">{passerelle}</span></> : null}.
                    </p>
                    <p className="mt-1 text-stone-600">
                      Saisissez les 6 chiffres reçus. La console de la passerelle reste ouverte
                      pendant l’envoi — c’est tout l’intérêt de la démonstration.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="code" className="block text-[13.5px] font-semibold">
                      Code de vérification
                    </label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codeSaisi}
                      onChange={(e) => setCodeSaisi(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className={`${CHAMP} text-center text-2xl tracking-[0.4em]`}
                    />
                  </div>

                  {erreur && <Alerte>{erreur}</Alerte>}

                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={recommencerOtp} className={BOUTON_SECONDAIRE}>
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={validerCode}
                      disabled={chargementOtp || codeSaisi.length !== 6}
                      className={`${BOUTON_PRINCIPAL} flex-1`}
                    >
                      {chargementOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Valider le code
                    </button>
                  </div>

                  <p className="text-center text-[12.5px] text-stone-500">
                    Rien reçu ?{' '}
                    {compteur > 0 ? (
                      <>nouvel essai dans {compteur} s</>
                    ) : (
                      <button type="button" onClick={demanderCode} className="font-bold text-[#1D4ED8] underline underline-offset-4">
                        renvoyer le SMS
                      </button>
                    )}
                  </p>

                  {codeSecours && (
                    <details className="rounded-lg border border-[#1C1917]/10 bg-[#F7F5F0] px-4 py-3 text-[12.5px] text-stone-600">
                      <summary className="cursor-pointer font-semibold text-[#1C1917]">
                        Le SMS n’arrive pas ? Afficher le code de secours
                      </summary>
                      <p className="mt-2">
                        Utile pour montrer la démonstration sans téléphone sous la main. Un vrai
                        envoi, lui, se vérifie dans le journal de la console.{' '}
                        <span className="ml-1 rounded bg-white px-2 py-0.5 font-mono text-[13px] font-bold text-[#1C1917]">
                          {codeSecours}
                        </span>
                      </p>
                    </details>
                  )}
                </div>
              )}

              {etapeOtp === 'succes' && (
                <div className="mx-auto max-w-lg space-y-5 py-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#15803B]/10 text-[#15803B]">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">Code accepté</h3>
                    <p className="mt-1 text-[13.5px] text-stone-600">
                      Le code reçu au <span className="font-mono">{numero}</span> correspond à celui
                      fabriqué par le serveur.
                    </p>
                  </div>

                  <p
                    className={`rounded-lg px-4 py-3 text-[13px] font-semibold ${
                      statutEnvoi?.envoye
                        ? 'bg-[#15803B]/10 text-[#15803B]'
                        : 'border border-[#1C1917]/10 bg-[#F7F5F0] text-stone-600'
                    }`}
                  >
                    {statutEnvoi?.envoye
                      ? 'La passerelle a confirmé l’envoi du SMS (statut ENVOYE en base).'
                      : `Envoi en cours côté passerelle (statut ${statutEnvoi?.statut || 'EN_ATTENTE'}) : le SMS part à la prochaine scrutation.`}
                  </p>

                  <button type="button" onClick={recommencerOtp} className={BOUTON_SECONDAIRE}>
                    <RefreshCw className="h-4 w-4" /> Tester un autre numéro
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODULE 2 — SMS ENTRANT ================= */}
          {onglet === 'commande' && (
            <div className={`${CARTE} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1C1917]/10 pb-5">
                <div>
                  <p className={`${ETIQUETTE} text-[#1D4ED8]`}>SMS entrant</p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                    Une commande payée par SMS
                  </h2>
                  <p className="mt-1 text-[13.5px] text-stone-600">
                    Le téléphone capte le message, le serveur le rattache à la commande.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15803B]/10 px-3 py-1 text-[11px] font-bold text-[#15803B]">
                  <Check className="h-3.5 w-3.5" /> Déjà en production
                </span>
              </div>

              {etapeCommande === 'panier' && (
                <div className="mx-auto max-w-lg space-y-5 pt-6">
                  <div className="rounded-xl border border-[#1C1917]/10 bg-[#F7F5F0] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`${ETIQUETTE} text-stone-500`}>Produit fictif</p>
                        <h3 className="mt-1.5 text-[15px] font-bold">
                          Abonnement Premium SMS IKA Pro
                        </h3>
                        <p className="mt-1 text-[13px] text-stone-600">
                          Accès API illimité, passerelle multi-SIM.
                        </p>
                      </div>
                      <span className="whitespace-nowrap font-mono text-[15px] font-bold">10 000 Ar</span>
                    </div>
                    <p className="mt-4 border-t border-[#1C1917]/10 pt-3 text-[13px] text-stone-600">
                      Paiement : SMS / Mobile Money
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReference(`CMD-${Math.floor(1000 + Math.random() * 9000)}`)
                      setSmsRecu(null)
                      setEtapeCommande('attente')
                    }}
                    className={`${BOUTON_PRINCIPAL} w-full`}
                  >
                    <ShoppingCart className="h-4 w-4" /> Commander et payer par SMS
                  </button>
                </div>
              )}

              {etapeCommande === 'attente' && (
                <div className="mx-auto max-w-lg space-y-5 pt-6">
                  <div className="rounded-xl bg-[#1C1917] p-6 text-[#F7F5F0]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`${ETIQUETTE} text-[#93C5FD]`}>Instructions de paiement</p>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34d399]" />
                        En écoute
                      </span>
                    </div>

                    <p className="mt-4 text-[13.5px] leading-relaxed text-stone-300">
                      {numeroPasserelle ? (
                        <>
                          Envoyez un SMS depuis n’importe quel téléphone au{' '}
                          <span className="font-mono font-bold text-white">{numeroPasserelle}</span>,
                          avec exactement ce texte :
                        </>
                      ) : (
                        <>
                          Envoyez un SMS depuis n’importe quel téléphone vers le numéro de la SIM
                          de la passerelle, avec exactement ce texte :
                        </>
                      )}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/15 bg-black/30 px-4 py-3">
                      <span className="font-mono text-[14px] font-bold text-[#6ee7b7]">
                        PAYER {reference}
                      </span>
                      <button
                        type="button"
                        onClick={copierInstruction}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-bold transition hover:bg-white/20"
                      >
                        {copie ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copie ? 'Copié' : 'Copier'}
                      </button>
                    </div>

                    <p className="mt-3 text-[12px] text-stone-400">
                      Dès que la passerelle capte le message, cet écran se met à jour tout seul.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1D4ED8]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Recherche du SMS sur le serveur…
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEtapeCommande('panier')
                        setReference('')
                      }}
                      className="text-[12.5px] text-stone-500 underline underline-offset-4 transition hover:text-[#1C1917]"
                    >
                      Annuler la commande
                    </button>
                  </div>
                </div>
              )}

              {etapeCommande === 'succes' && (
                <div className="mx-auto max-w-lg space-y-5 py-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#15803B]/10 text-[#15803B]">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight">Paiement détecté</h3>
                    <p className="mt-1 text-[13.5px] text-stone-600">
                      Commande <span className="font-mono">{reference}</span> rapprochée du SMS reçu.
                    </p>
                  </div>

                  {smsRecu && (
                    <div className="rounded-xl border border-[#1C1917]/10 bg-[#F7F5F0] p-4 text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-stone-500">
                        <span>
                          Expéditeur : <span className="font-mono text-[#1C1917]">{smsRecu.expediteur}</span>
                        </span>
                        <span>{new Date(smsRecu.date_reception).toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="mt-2 rounded-lg border border-[#1C1917]/10 bg-white p-3 font-mono text-[13px]">
                        {smsRecu.contenu}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEtapeCommande('panier')
                      setReference('')
                      setSmsRecu(null)
                    }}
                    className={BOUTON_SECONDAIRE}
                  >
                    <RefreshCw className="h-4 w-4" /> Passer une nouvelle commande
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ce qu'il faut retenir */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#1C1917]/10 bg-white p-5">
              <p className={`${ETIQUETTE} text-[#1D4ED8]`}>SMS sortant</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-stone-600">
                Le serveur crée la tâche, le téléphone la réclame, la SIM envoie. Le même
                chemin que vos envois de production — sans code à écrire.
              </p>
              <Link
                href="/espace/api"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1D4ED8] underline decoration-[#2563EB]/40 underline-offset-4 hover:decoration-[#2563EB]"
              >
                Voir la documentation API
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-[#1C1917]/10 bg-white p-5">
              <p className={`${ETIQUETTE} text-[#1D4ED8]`}>SMS entrant</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-stone-600">
                Un client répond, le message remonte et se rattache à la bonne application.
                Vos réponses ne se perdent pas dans la mémoire du téléphone.
              </p>
              <Link
                href="/cas-d-usage"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1D4ED8] underline decoration-[#2563EB]/40 underline-offset-4 hover:decoration-[#2563EB]"
              >
                Explorer les cas d’usage
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PiedAccueil />
    </div>
  )
}
