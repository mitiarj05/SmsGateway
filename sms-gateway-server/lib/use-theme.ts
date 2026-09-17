'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'sms-gateway-theme'

function initialTheme(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem(KEY)
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Thème partagé : source unique (localStorage), écriture au toggle uniquement.
 * - Suit l'OS en direct tant que l'utilisateur n'a rien choisi.
 * - Applique la classe `dark` + la couleur du navigateur mobile.
 * - `mounted` garde un rendu neutre pré-hydratation (identique serveur/client).
 */
export function useTheme() {
  const [darkMode, setDarkMode] = useState(initialTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(KEY)) setDarkMode(e.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', darkMode ? '#09090b' : '#ffffff')
  }, [darkMode])

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem(KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  return { darkMode, mounted, toggleTheme }
}
