import { redirect } from 'next/navigation'

/** La racine sert le dashboard (protégé par le proxy : redirige vers /login si besoin). */
export default function Home() {
  redirect('/dashboard')
}
