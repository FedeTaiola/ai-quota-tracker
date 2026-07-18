import { NextResponse } from 'next/server'
import { getAccounts, getServices } from '@/app/actions/services' // Wait, getServices is in services, getAccounts is in accounts. Let's fix imports

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Check if it's a message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = body.message.chat.id
    const text = body.message.text.trim()

    // Only respond to our designated Chat ID
    if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true })
    }

    if (text.startsWith('/status')) {
      await handleStatus(chatId)
    } else if (text.startsWith('/help') || text.startsWith('/start')) {
      await sendTelegramMessage(chatId, "⚡️ *AI Quota Tracker*\n\nSono il tuo bot per il monitoraggio delle quote. Usa /status per vedere lo stato degli account.")
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function handleStatus(chatId: string | number) {
  const { getAccounts } = await import('@/app/actions/accounts')
  const { getServices } = await import('@/app/actions/services')
  
  const accounts = await getAccounts()
  const services = await getServices()

  if (!accounts || accounts.length === 0) {
    await sendTelegramMessage(chatId, "Non ci sono account configurati.")
    return
  }

  let msg = "📊 *Stato Account AI*\n\n"

  accounts.forEach(acc => {
    const svc = services.find(s => s.id === acc.service_id)
    if (!svc) return

    const days = acc.plan === 'pro' ? svc.pro_days : svc.free_days
    const msLeft = new Date(new Date(acc.cycle_started_at).getTime() + days * 86400000).getTime() - Date.now()
    const st = msLeft <= 0 ? '🔄 Scaduto' : acc.quota_status === 'exhausted' ? '🔴 Esaurito' : '✅ Ok'
    
    msg += `${svc.icon} *${acc.name}* (${svc.name})\n`
    msg += `Stato: ${st}\n`
    if (msLeft > 0) {
      const d = Math.floor(msLeft / 86400000)
      const h = Math.floor((msLeft % 86400000) / 3600000)
      msg += `Reset tra: ${d}g ${h}h\n`
    }
    msg += `\n`
  })

  await sendTelegramMessage(chatId, msg)
}

async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  })
}
