'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Service, createService, deleteService } from '@/app/actions/services'
import { X, Trash2 } from 'lucide-react'

export function SettingsModal({ services }: { services: Service[] }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const [form, setForm] = useState({
    name: '',
    icon: '⚙️',
    color_from: '#10b981',
    color_to: '#34d399',
    free_days: 30,
    pro_days: 30
  })

  function closeModal() {
    router.push('/')
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    const id = form.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) + Math.floor(Math.random() * 100)
    await createService({ id, ...form })
    setForm({ name: '', icon: '⚙️', color_from: '#10b981', color_to: '#34d399', free_days: 30, pro_days: 30 })
    setIsPending(false)
  }

  async function handleDelete(id: string, name: string) {
    if (confirm(`Eliminare il servizio "${name}"? Tutti gli account associati verranno eliminati! (Cascade delete)`)) {
      setIsPending(true)
      await deleteService(id)
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-5 overflow-y-auto">
      <div className="bg-bg-modal border border-border rounded-2xl w-full max-w-lg shadow-2xl my-auto flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold">Impostazioni Servizi</h2>
          <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-danger/15 hover:text-danger transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-[0.7rem] text-text-muted">Free: {s.free_days}g | Pro: {s.pro_days}g</div>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id, s.name)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-danger/15 hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddService} className="border-t border-border/50 pt-5 space-y-4">
            <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-3">Aggiungi Nuovo Servizio</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Nome</label>
                <input required type="text" placeholder="es. ChatGPT" className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Icona</label>
                <input required type="text" maxLength={2} className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2" value={form.icon} onChange={e=>setForm({...form, icon: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Reset Free (giorni)</label>
                <input required type="number" min={1} className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2" value={form.free_days} onChange={e=>setForm({...form, free_days: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Reset Pro (giorni)</label>
                <input required type="number" min={1} className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ag-from focus:ring-2" value={form.pro_days} onChange={e=>setForm({...form, pro_days: parseInt(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Sfumatura (Da)</label>
                <input type="color" className="w-full h-10 bg-white/5 border border-border rounded-lg p-1 outline-none" value={form.color_from} onChange={e=>setForm({...form, color_from: e.target.value})} />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Sfumatura (A)</label>
                <input type="color" className="w-full h-10 bg-white/5 border border-border rounded-lg p-1 outline-none" value={form.color_to} onChange={e=>setForm({...form, color_to: e.target.value})} />
              </div>
            </div>

            <button disabled={isPending} type="submit" className="w-full py-2.5 mt-2 rounded-lg font-bold text-sm bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50">
              {isPending ? 'Salvataggio...' : '+ Aggiungi Servizio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
