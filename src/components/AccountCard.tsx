'use client'

import { Account, Service } from '@/app/actions/services'
import { useState, useEffect } from 'react'
import { Pencil, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { markQuotaExhausted, markQuotaAvailable, renewCycle, deleteAccount, updateAccount } from '@/app/actions/accounts'
import { clsx } from 'clsx'
import Link from 'next/link'

type Props = {
  account: Account
  service: Service
}

function getMsToReset(a: Account, s: Service) {
  const days = a.plan === 'pro' ? s.pro_days : s.free_days
  const resetMs = days * 86400000
  const resetDate = new Date(new Date(a.cycle_started_at).getTime() + resetMs)
  return resetDate.getTime() - Date.now()
}

function fmt(ms: number) {
  if (ms <= 0) return '🔄 RESET OGGI!'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = (n: number) => n.toString().padStart(2, '0')
  return d > 0 ? `${d}g ${p(h)}:${p(m)}:${p(sec)}` : `${p(h)}:${p(m)}:${p(sec)}`
}

function fmtDateShort(dt: string | Date) {
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dt))
}

export function AccountCard({ account, service }: Props) {
  const [msLeft, setMsLeft] = useState(() => getMsToReset(account, service))
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const int = setInterval(() => {
      setMsLeft(getMsToReset(account, service))
    }, 1000)
    return () => clearInterval(int)
  }, [account, service])

  const st = msLeft <= 0 
    ? 'cycle-done' 
    : account.quota_status === 'exhausted' 
      ? 'exhausted' 
      : msLeft < 86400000 * 1.5 
        ? 'expiring' 
        : 'available'

  const resetDt = new Date(new Date(account.cycle_started_at).getTime() + (account.plan === 'pro' ? service.pro_days : service.free_days) * 86400000)
  const cycleMs = (account.plan === 'pro' ? service.pro_days : service.free_days) * 86400000
  const elapsed = Date.now() - new Date(account.cycle_started_at).getTime()
  const cyclePct = Math.min(100, Math.max(0, (elapsed / cycleMs) * 100)).toFixed(1)
  
  const [localQpct, setLocalQpct] = useState(account.quota_percent)
  const qLow = localQpct < 25
  
  // Sync local state if remote state changes
  useEffect(() => {
    setLocalQpct(account.quota_percent)
  }, [account.quota_percent])

  async function handleQuotaChangeEnd(val: number) {
    if (val === account.quota_percent) return
    setIsPending(true)
    await updateAccount(account.id, { 
      quota_percent: val, 
      quota_status: val === 0 ? 'exhausted' : (val > 0 && account.quota_status === 'exhausted' ? 'available' : account.quota_status)
    })
    setIsPending(false)
  }

  async function handleExhaust() {
    if (confirm(`Segnare "${account.name}" come quota ESAURITA?`)) {
      setIsPending(true)
      await markQuotaExhausted(account.id)
      setIsPending(false)
    }
  }

  async function handleRestore() {
    setIsPending(true)
    await markQuotaAvailable(account.id)
    setIsPending(false)
  }

  async function handleRenew() {
    if (confirm(`Avviare un nuovo ciclo per "${account.name}" a partire da ADESSO?`)) {
      setIsPending(true)
      await renewCycle(account.id)
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (confirm(`Sei sicuro di voler eliminare l'account "${account.name}"?`)) {
      setIsPending(true)
      await deleteAccount(account.id)
      // UI updates via Next.js server actions revalidation
    }
  }

  return (
    <div className={clsx(
      "relative overflow-hidden glass-card rounded-[14px] p-5 transition-all duration-200",
      st === 'exhausted' && "border-danger/25 bg-danger/5",
      st === 'expiring' && "border-warn/25 bg-warn/5",
      !['exhausted', 'expiring'].includes(st) && "hover:-translate-y-0.5 hover:shadow-lg"
    )}>
      {/* Top Gradient Border */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${service.color_from || '#6c63ff'}, ${service.color_to || '#a78bfa'})` }}
      />

      <div className="flex items-start gap-3 mb-4">
        <div 
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${service.color_from || '#6c63ff'}, ${service.color_to || '#a78bfa'})` }}
        >
          {account.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[0.95rem] truncate">{account.name}</div>
          <div className="text-xs text-text-muted mt-0.5 truncate">{account.email || '—'}</div>
          
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/5" style={{ color: service.color_to || '#a78bfa' }}>
              {service.icon} {service.name}
            </span>
            <span className={clsx("text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", account.plan === 'pro' ? 'bg-warn/15 text-yellow-400' : 'bg-white/5 text-text-secondary')}>
              {account.plan === 'free' ? 'Free' : 'Pro'}
            </span>
            
            {st === 'available' && <span className="text-[0.68rem] font-bold px-2.5 py-[3px] rounded-full tracking-wide bg-ok/15 text-ok border border-ok/25 flex items-center gap-1">✅ Disponibile</span>}
            {st === 'cycle-done' && <span className="text-[0.68rem] font-bold px-2.5 py-[3px] rounded-full tracking-wide bg-ok/15 text-ok border border-ok/25 flex items-center gap-1">🔄 Ciclo scaduto</span>}
            {st === 'exhausted' && <span className="text-[0.68rem] font-bold px-2.5 py-[3px] rounded-full tracking-wide bg-danger/15 text-danger border border-danger/25 flex items-center gap-1 animate-pulse">🔴 Quota esaurita</span>}
            {st === 'expiring' && <span className="text-[0.68rem] font-bold px-2.5 py-[3px] rounded-full tracking-wide bg-warn/15 text-warn border border-warn/25 flex items-center gap-1">⚠️ Reset imminente</span>}
          </div>
          {account.notes && <div className="text-[0.7rem] text-text-muted italic mt-1.5 truncate">💬 {account.notes}</div>}
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-3.5 mb-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.7rem] text-text-muted uppercase tracking-widest">
            {st === 'available' ? 'Prossimo reset tra' : st === 'exhausted' ? 'Sbloccato tra' : st === 'expiring' ? 'Reset tra' : 'Il ciclo è scaduto —'}
          </span>
          <span className="text-[0.72rem] text-text-secondary font-mono">reset: {fmtDateShort(resetDt)}</span>
        </div>
        <div className={clsx(
          "font-mono text-2xl font-medium mt-1.5 leading-none",
          st === 'exhausted' ? 'text-danger' : st === 'expiring' ? 'text-warn' : 'text-ok'
        )}>
          {st === 'cycle-done' ? '—' : fmt(msLeft)}
        </div>
        <div className={clsx(
          "text-[0.72rem] mt-1",
          st === 'available' ? 'text-ok/60' : st === 'exhausted' ? 'text-danger/60' : st === 'expiring' ? 'text-warn/60' : 'text-ok/60'
        )}>
          {st === 'available' ? `Data reset: ${fmtDateShort(resetDt)}` : st === 'exhausted' ? `Sei bloccato fino al ${fmtDateShort(resetDt)}` : st === 'expiring' ? `Reset il ${fmtDateShort(resetDt)}` : 'avvia un nuovo ciclo'}
        </div>

        <div className="mt-2.5">
          <div className="flex justify-between text-[0.68rem] text-text-muted mb-1">
            <span>Inizio: {fmtDateShort(account.cycle_started_at)}</span>
            <span>{cyclePct}% del ciclo</span>
          </div>
          <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-white/15 transition-all duration-500" style={{ width: `${cyclePct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[0.7rem] text-text-muted mb-1.5">
          <span>Quota rimanente</span>
          <span className={clsx("font-bold", qLow ? "text-danger" : "text-text-secondary")}>{localQpct}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/10 overflow-hidden relative group">
          <div 
            className="h-full rounded-full transition-all duration-100 ease-linear" 
            style={{ 
              width: `${localQpct}%`,
              background: qLow ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : `linear-gradient(90deg, ${service.color_from || '#6c63ff'}, ${service.color_to || '#a78bfa'})`
            }} 
          />
          <input 
            type="range"
            min="0" max="100" step="1"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={localQpct}
            onChange={(e) => setLocalQpct(parseInt(e.target.value))}
            onMouseUp={(e) => handleQuotaChangeEnd(parseInt((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => handleQuotaChangeEnd(parseInt((e.target as HTMLInputElement).value))}
            disabled={isPending}
            title="Trascina per modificare la quota"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {st === 'cycle-done' ? (
          <button disabled={isPending} onClick={handleRenew} className="flex-1 min-w-[120px] py-2 px-2 rounded-md text-[0.75rem] font-bold border flex items-center justify-center gap-1 transition-all bg-ag-from/10 border-ag-from/25 text-ag-to hover:bg-ag-from/20 hover:border-ag-from disabled:opacity-50">
            <RefreshCw className="w-3.5 h-3.5" /> Ho mandato il 1° msg
          </button>
        ) : st === 'exhausted' ? (
          <>
            <button disabled={isPending} onClick={handleRestore} className="flex-1 min-w-[120px] py-2 px-2 rounded-md text-[0.75rem] font-bold border flex items-center justify-center gap-1 transition-all bg-ok/10 border-ok/25 text-ok/85 hover:bg-ok/20 hover:border-ok hover:text-ok disabled:opacity-50">
              <CheckCircle className="w-3.5 h-3.5" /> Ripristinata
            </button>
            <button disabled={isPending} onClick={handleRenew} className="flex-1 min-w-[120px] py-2 px-2 rounded-md text-[0.75rem] font-bold border flex items-center justify-center gap-1 transition-all bg-ag-from/10 border-ag-from/25 text-ag-to hover:bg-ag-from/20 hover:border-ag-from disabled:opacity-50">
              <RefreshCw className="w-3.5 h-3.5" /> Nuovo ciclo
            </button>
          </>
        ) : (
          <button disabled={isPending} onClick={handleExhaust} className="flex-1 min-w-[120px] py-2 px-2 rounded-md text-[0.75rem] font-bold border flex items-center justify-center gap-1 transition-all bg-danger/10 border-danger/25 text-danger/85 hover:bg-danger/20 hover:border-danger hover:text-danger disabled:opacity-50">
            <AlertCircle className="w-3.5 h-3.5" /> Quota esaurita ora
          </button>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 mt-3 border-t border-border">
        <div className="text-[0.7rem] text-text-muted">⏱ Ciclo di {account.plan === 'pro' ? service.pro_days : service.free_days} giorni</div>
        <div className="flex gap-1.5">
          <Link href={`?modal=edit&id=${account.id}`} className="w-7 h-7 rounded-md flex items-center justify-center bg-white/5 text-text-secondary hover:bg-ag-from/20 hover:text-ag-to transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <button disabled={isPending} onClick={handleDelete} className="w-7 h-7 rounded-md flex items-center justify-center bg-white/5 text-text-secondary hover:bg-danger/15 hover:text-danger transition-colors disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
