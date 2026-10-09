'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

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
      const minuteries: ReturnType<typeof setTimeout>[] = []

      // Tentatives répétées : le script peut être lent ou bloqué au 1er
      // chargement (adblocker, réseau). Une seule tentative silencieuse = case
      // invisible jusqu'à la prochaine navigation.
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
        if (++tentatives < 50 && monte) {
          minuteries.push(setTimeout(essayerRendu, 200))
        }
      }

      chargerScript().then(essayerRendu)
      // Filet de sécurité : revérifie 3 s après le montage.
      minuteries.push(
        setTimeout(() => {
          if (monte && identifiant.current === null) essayerRendu()
        }, 3000)
      )
      return () => {
        monte = false
        minuteries.forEach(clearTimeout)
      }
    }, [cleSite])

    if (!cleSite) return null
    return <div ref={conteneur} className="flex justify-center" />
  }
)
