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
  return <DemoClient />
}
