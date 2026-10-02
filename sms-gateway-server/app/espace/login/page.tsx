import { redirect } from 'next/navigation'

/** L'espace client se connecte depuis la page unique /login (onglet Client). */
export default function PageConnexionEspace() {
  redirect('/login')
}
