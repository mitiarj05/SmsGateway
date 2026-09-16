import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

interface HourlyRow {
  hour: string
  count: number
}

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfDayISO = startOfDay.toISOString()

    const { data, error } = await supabaseAdmin
      .from('sms_tasks')
      .select('created_at, statut')
      .gte('created_at', startOfDayISO)
      .lte('created_at', now.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hours: HourlyRow[] = []
    for (let i = 23; i >= 0; i--) {
      const hourTime = new Date(now.getTime() - i * 3600000)
      const hourLabel = hourTime.toLocaleTimeString('fr-FR', { hour: '2-digit', hour12: false })
      const hourStart = new Date(hourTime.getTime() - 3600000).toISOString()
      const hourEnd = hourTime.toISOString()

      const count = (data ?? []).filter(t => {
        const tTime = new Date(t.created_at)
        return tTime >= new Date(hourStart) && tTime < new Date(hourEnd)
      }).length

      hours.push({ hour: hourLabel, count })
    }

    return NextResponse.json({ hourly: hours })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
