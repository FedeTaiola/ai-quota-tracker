'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Service, Account } from '@/app/actions/services'
import { createAccount, updateAccount } from '@/app/actions/accounts'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

type Props = {
  services: Service[]
  accountToEdit?: Account
}

export function AddAccountModal({ services, accountToEdit }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const [form, setForm] = useState({
    service_id: accountToEdit?.service_id || services[0]?.id || '',
    plan: accountToEdit?.plan || 'free',
    name: accountToEdit?.name || '',
    email: accountToEdit?.email || '',
    notes: accountToEdit?.notes || '',
    cycle_started_at: accountToEdit ? new Date(accountToEdit.cycle_started_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    quota_status: accountToEdit?.quota_status || 'available',
    quota_percent: accountToEdit?.quota_percent ?? 100
  })

  function closeModal() {
    router.push('/')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)

    const data = {
      ...form,
      cycle_started_at: new Date(form.cycle_started_at).toISOString()
    }

    if (accountToEdit) {
      await updateAccount(accountToEdit.id, data as any)
    } else {
      // Need to generate an id for client side or let postgres handle it?
      // Wait, in our schema `id` is VARCHAR(50). We need to generate one if postgres doesn't have a default.
      // Schema: `id VARCHAR(50) PRIMARY KEY` without default. We must provide an id.
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      await createAccount({ id, ...data } as any)
    }

    setIsPending(false)
    closeModal()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-5 overflow-y-auto">
      <div className="bg-bg-modal border border-border rounded-2xl w-full max-w-lg shadow-2xl my-auto flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold">{accountToEdit ? 'Modifica Account' : 'Aggiungi Account'}</h2>
          <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-danger/15 hover:text-danger transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border/50">Servizio & Piano</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Servizio</label>
                <select 
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                  value={form.service_id}
                  onChange={e => setForm({...form, service_id: e.target.value})}
                  required
                >
                  {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Piano</label>
                <select 
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                  value={form.plan}
                  onChange={e => setForm({...form, plan: e.target.value as 'free'|'pro'})}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro (a pagamento)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border/50">Dettagli Account</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Nome</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Mario Rossi"
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Email (Opzionale)</label>
                <input 
                  type="email" 
                  placeholder="mario@email.com"
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Note / Info extra</label>
              <input 
                type="text" 
                placeholder="Account diviso con..."
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>
          </div>

          <div>
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-3 pb-2 border-b border-border/50">Ciclo & Quota</div>
            
            <div className="mb-4">
              <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Inizio Ciclo (Primo Messaggio)</label>
              <input 
                type="datetime-local" 
                required
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                value={form.cycle_started_at}
                onChange={e => setForm({...form, cycle_started_at: e.target.value})}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                <button type="button" onClick={() => setForm({...form, cycle_started_at: new Date().toISOString().slice(0, 16)})} className="text-[0.7rem] px-2.5 py-1 rounded-full border border-border hover:bg-white/5 transition-colors">⚡ Adesso</button>
                <button type="button" onClick={() => setForm({...form, cycle_started_at: new Date(Date.now() - 3600000).toISOString().slice(0, 16)})} className="text-[0.7rem] px-2.5 py-1 rounded-full border border-border hover:bg-white/5 transition-colors">1 ora fa</button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Stato Attuale Quota</label>
              <select 
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2 focus:ring-ag-from/20"
                value={form.quota_status}
                onChange={e => setForm({...form, quota_status: e.target.value as 'available'|'exhausted'})}
              >
                <option value="available">✅ Disponibile</option>
                <option value="exhausted">🔴 Esaurita</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Quota rimanente ({form.quota_percent}%)</label>
              <input 
                type="range" 
                min="0" max="100" step="1"
                className="w-full accent-ag-from"
                value={form.quota_percent}
                onChange={e => setForm({...form, quota_percent: parseInt(e.target.value)})}
              />
            </div>
          </div>

        </form>

        <div className="p-6 border-t border-border/50 flex justify-end gap-3 bg-bg-modal rounded-b-2xl">
          <button type="button" onClick={closeModal} className="px-5 py-2 rounded-lg font-bold text-sm bg-white/5 text-text-secondary hover:bg-white/10 transition-colors">
            Annulla
          </button>
          <button disabled={isPending} onClick={handleSubmit} className="px-5 py-2 rounded-lg font-bold text-sm bg-gradient-to-br from-ag-from to-ag-to text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-50">
            {isPending ? 'Salvataggio...' : accountToEdit ? 'Aggiorna' : 'Salva Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
