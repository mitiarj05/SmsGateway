import type { Metadata } from 'next'
import AccueilClient from '../composants/accueil/AccueilClient'

export const metadata: Metadata = {
  title: 'SMSTSIKA — Vos téléphones deviennent votre passerelle SMS',
  description:
    'Branchez un téléphone Android, ouvrez votre console, envoyez. Sans abonnement, 100 % auto-hébergé : vos SIM, vos tarifs, vos données restent chez vous.',
  openGraph: {
    title: 'SMSTSIKA — Vos téléphones deviennent votre passerelle SMS',
    description:
      'Passerelle SMS sans abonnement : vos Android, vos SIM, votre console, votre API. 100 % auto-hébergé.',
    type: 'website',
  },
}

export default function PageAccueil() {
  return <AccueilClient />
}
