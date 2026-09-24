'use client'

import { useState, useEffect, useCallback } from 'react'

const CLE = 'smsika-theme'

function themeInitial(): boolean {
  if (typeof window === 'undefined') return false
  const sauvegarde = localStorage.getItem(CLE)
  if (sauvegarde) return sauvegarde === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Thème partagé : source unique (localStorage), écriture au basculement uniquement.
 * - Suit l'OS en direct tant que l'utilisateur n'a rien choisi.
 * - Applique la classe `dark` + la couleur du navigateur mobile.
 * - `monte` garde un rendu neutre pré-hydratation (identique serveur/client).
 */
export function useTheme() {
  const [modeSombre, setModeSombre] = useState(themeInitial)
  const [monte, setMonte] = useState(false)

  useEffect(() => {
    setMonte(true)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const auChangement = (evenement: MediaQueryListEvent) => {
      if (!localStorage.getItem(CLE)) setModeSombre(evenement.matches)
    }
    media.addEventListener('change', auChangement)
    return () => media.removeEventListener('change', auChangement)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modeSombre)
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', modeSombre ? '#09090b' : '#ffffff')
  }, [modeSombre])

  const basculerTheme = useCallback(() => {
    setModeSombre((precedent) => {
      const suivant = !precedent
      localStorage.setItem(CLE, suivant ? 'dark' : 'light')
      return suivant
    })
  }, [])

  return { modeSombre, monte, basculerTheme }
}
