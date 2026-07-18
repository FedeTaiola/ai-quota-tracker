import { NextResponse } from 'next/server'
import { getAccounts } from '@/app/actions/accounts'
import { getServices } from '@/app/actions/services'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accounts = await getAccounts()
    const services = await getServices()
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!chatId || !accounts || accounts.length === 0) {
      return NextResponse.json({ ok: true, msg: 'Nothing to do' })
    }

    let alertMsg = ""

    accounts.forEach(acc => {
      const svc = services.find(s => s.id === acc.service_id)
      if (!svc) return

      const days = acc.plan === 'pro' ? svc.pro_days : svc.free_days
      const msLeft = new Date(new Date(acc.cycle_started_at).getTime() + days * 86400000).getTime() - Date.now()
      
      const hoursLeft = msLeft / 3600000
      const daysLeft = msLeft / 86400000

      // Notifica se mancano meno di 24 ore e l'account è bloccato o libero
      // Per evitare spam, servirebbe una flag nel DB "notified_at", ma un cron giornaliero va bene
      if (daysLeft < 1 && daysLeft > 0) {
        alertMsg += `⚠️ *${acc.name}* (${svc.name}) si resetta tra meno di 24h!\n`
      } else if (msLeft <= 0) {
        alertMsg += `🔄 *${acc.name}* (${svc.name}) è PRONTO PER IL RESET! Vai nell'app e avvia il ciclo.\n`
      }
    })

    if (alertMsg) {
      const token = process.env.TELEGRAM_BOT_TOKEN
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔔 *Allerte Quota AI*\n\n${alertMsg}`,
            parse_mode: 'Markdown'
          })
        })
      }
    }

    return NextResponse.json({ ok: true, alerts_sent: !!alertMsg })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
