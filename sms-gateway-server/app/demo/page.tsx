import type { Metadata } from 'next'
import DemoClient from '../../composants/demo/DemoClient'

export const metadata: Metadata = {
  title: 'Démo en direct — SMSTSIKA',
  description:
    'Testez la passerelle avec de vrais SMS : recevez un code de vérification sur votre numéro, ou faites détecter un SMS de paiement. Aucune simulation.',
  openGraph: {
    title: 'Démo en direct — SMSTSIKA',
    description:
      'Envoyez un vrai SMS depuis votre Android passerelle, et voyez un SMS entrant se rattacher à une commande.',
    type: 'website',
  },
}

export default function PageDemo() {
  // Le numéro de la SIM passerelle n'est pas stocké en base : il s'affiche si
  // l'exploitant le renseigne. Sans lui, la démo « SMS entrant » reste utilisable
  // mais le visiteur doit connaître le numéro de la carte.
  const numeroPasserelle = process.env.DEMO_NUMERO_PASSERELLE?.trim() || null
  return <DemoClient numeroPasserelle={numeroPasserelle} />
}
