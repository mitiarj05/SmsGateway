'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      render: (conteneur: HTMLElement, params: Record<string, unknown>) => number
      reset: (identifiant?: number) => void
    }
  }
}

export interface PoigneeAntiRobot {
  reinitialiser: () => void
}

interface Proprietes {
  /** NEXT_PUBLIC_RECAPTCHA_SITE_KEY — absent = case masquée (clés non configurées). */
  cleSite: string | undefined
  change: (jeton: string | null) => void
}

let promesseScript: Promise<void> | null = null

function chargerScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.grecaptcha) return Promise.resolve()
  if (!promesseScript) {
    promesseScript = new Promise((resolve) => {
      const existant = document.querySelector('script[data-antirobot]')
      if (existant) {
        const attendre = () => {
          if (window.grecaptcha) resolve()
          else setTimeout(attendre, 100)
        }
        attendre()
        return
      }
      const element = document.createElement('script')
      element.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      element.async = true
      element.defer = true
      element.dataset.antirobot = '1'
      element.onload = () => resolve()
      element.onerror = () => resolve()
      document.head.appendChild(element)
    })
  }
  return promesseScript
}

/**
 * Case « Je ne suis pas un robot » (reCAPTCHA v2).
 * Sans `cleSite`, rien n'est affiché — le serveur ignore alors le contrôle
 * (dev local). Avec clés configurées, le jeton doit accompagner l'envoi.
 */
export const CaseAntiRobot = forwardRef<PoigneeAntiRobot, Proprietes>(
  function CaseAntiRobot({ cleSite, change }, ref) {
  const conteneur = useRef<HTMLDivElement>(null)
  const identifiant = useRef<number | null>(null)
  const changeRef = useRef(change)
  changeRef.current = change
  const [blocage, setBlocage] = useState(false)
  const [relance, setRelance] = useState(0)

    useImperativeHandle(
      ref,
      () => ({
        reinitialiser() {
          if (window.grecaptcha && identifiant.current !== null) {
            try {
              window.grecaptcha.reset(identifiant.current)
            } catch {
              /* widget déjà expiré */
            }
            changeRef.current(null)
          }
        },
      }),
      []
    )

    useEffect(() => {
      if (!cleSite) return
      let monte = true
      let tentatives = 0
      let delai = 200
      let minuteur: ReturnType<typeof setTimeout> | null = null
      setBlocage(false)

      // Réessais persistants : sur réseau mobile lent ou avec bloqueur,
      // le script google.com/recaptcha peut mettre plus de 10 s. On insiste
      // en espaçant (200 ms → 2 s max) jusqu'au succès ou au démontage.
      const essayerRendu = (): void => {
        if (!monte) return
        if (window.grecaptcha && conteneur.current && identifiant.current === null) {
          try {
            identifiant.current = window.grecaptcha.render(conteneur.current, {
              sitekey: cleSite,
              callback: (jeton: string) => changeRef.current(jeton),
              'expired-callback': () => changeRef.current(null),
              'error-callback': () => changeRef.current(null),
            })
            return // rendu réussi
          } catch {
            /* re-essaie ci-dessous */
          }
        }
        tentatives += 1
        if (tentatives === 50 && monte) setBlocage(true)
        delai = Math.min(2000, delai + 200)
        if (monte) minuteur = setTimeout(essayerRendu, delai)
      }

      chargerScript().then(essayerRendu)
      return () => {
        monte = false
        if (minuteur) clearTimeout(minuteur)
      }
    }, [cleSite, relance])

    if (!cleSite) return null
    return (
      <div className="flex flex-col items-center gap-2">
        <div ref={conteneur} className="flex justify-center" />
        {blocage && identifiant.current === null && (
          <p className="text-center text-[11px] text-slate-500">
            Vérification anti-robot lente à charger — vérifiez votre connexion.{' '}
            <button
              type="button"
              onClick={() => setRelance((n) => n + 1)}
              className="font-bold text-blue-600 hover:underline"
            >
              Réessayer
            </button>
          </p>
        )}
      </div>
    )
  }
)
