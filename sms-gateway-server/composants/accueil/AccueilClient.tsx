'use client'

import { useReveal } from '../../lib/use-reveal'
import BarreAccueil from './BarreAccueil'
import HeroAccueil from './HeroAccueil'
import Piliers from './Piliers'
import Etapes from './Etapes'
import PreuveCode from './PreuveCode'
import SectionInstallation from './SectionInstallation'
import TeaserFaq from './TeaserFaq'
import AppelFinal from './AppelFinal'
import PiedAccueil from './PiedAccueil'

export default function AccueilClient() {
  useReveal()

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-[#1C1917] antialiased selection:bg-[#2563EB] selection:text-white">
      <style>{`a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid #1D4ED8;outline-offset:3px;border-radius:6px}input:focus-visible{outline:2px solid #1D4ED8;outline-offset:1px}`}</style>
      <BarreAccueil />
      <main>
        <HeroAccueil />
        <Piliers />
        <Etapes />
        <PreuveCode />
        <SectionInstallation />
        <TeaserFaq />
        <AppelFinal />
      </main>
      <PiedAccueil />
    </div>
  )
}
