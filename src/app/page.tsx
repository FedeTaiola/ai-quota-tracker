import { Navbar } from '@/components/Navbar'
import { getServices } from './actions/services'
import { getAccounts } from './actions/accounts'
import { AccountCard } from '@/components/AccountCard'
import { AddAccountModal } from '@/components/AddAccountModal'
import { SettingsModal } from '@/components/SettingsModal'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ modal?: string, id?: string }>
}

export default async function Home({ searchParams }: Props) {
  const { modal, id } = await searchParams
  const services = await getServices()
  const accounts = await getAccounts()

  const tot = accounts.length
  const avail = accounts.filter(a => a.quota_status !== 'exhausted' && new Date(new Date(a.cycle_started_at).getTime() + (a.plan === 'pro' ? (services.find(s => s.id === a.service_id)?.pro_days || 30) : (services.find(s => s.id === a.service_id)?.free_days || 30)) * 86400000).getTime() > Date.now()).length
  const exh = accounts.filter(a => a.quota_status === 'exhausted').length

  const blocked = accounts.filter(a => a.quota_status === 'exhausted').sort((a, b) => {
    const sA = services.find(s => s.id === a.service_id)
    const sB = services.find(s => s.id === b.service_id)
    const tA = new Date(new Date(a.cycle_started_at).getTime() + (a.plan === 'pro' ? (sA?.pro_days || 30) : (sA?.free_days || 30)) * 86400000).getTime()
    const tB = new Date(new Date(b.cycle_started_at).getTime() + (b.plan === 'pro' ? (sB?.pro_days || 30) : (sB?.free_days || 30)) * 86400000).getTime()
    return tA - tB
  })

  return (
    <>
      <Navbar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="glass-card rounded-[14px] p-5 transition-colors hover:border-ag-from/30">
          <div className="text-[0.72rem] text-text-muted uppercase tracking-widest mb-1.5">Account totali</div>
          <div className="text-3xl font-extrabold leading-none text-gradient">{tot}</div>
          <div className="text-[0.75rem] text-text-secondary mt-1">su tutti i servizi</div>
        </div>
        <div className="glass-card rounded-[14px] p-5 transition-colors hover:border-ag-from/30">
          <div className="text-[0.72rem] text-text-muted uppercase tracking-widest mb-1.5">Disponibili ora</div>
          <div className="text-3xl font-extrabold leading-none text-ok">{avail}</div>
          <div className="text-[0.75rem] text-text-secondary mt-1">quota ancora attiva ✅</div>
        </div>
        <div className="glass-card rounded-[14px] p-5 transition-colors hover:border-ag-from/30">
          <div className="text-[0.72rem] text-text-muted uppercase tracking-widest mb-1.5">Quota esaurita</div>
          <div className="text-3xl font-extrabold leading-none text-danger">{exh}</div>
          <div className="text-[0.75rem] text-text-secondary mt-1">in attesa di reset 🔴</div>
        </div>
        <div className="glass-card rounded-[14px] p-5 transition-colors hover:border-ag-from/30">
          <div className="text-[0.72rem] text-text-muted uppercase tracking-widest mb-1.5">Prossimo reset</div>
          <div className="text-[1.1rem] font-bold leading-none text-warn min-h-[30px] flex items-center">
            {blocked.length > 0 ? blocked[0].name : '—'}
          </div>
          <div className="text-[0.75rem] text-text-secondary mt-1">
            {blocked.length > 0 ? 'account bloccato' : 'nessun account bloccato'}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {services.map(svc => {
          const svcAccounts = accounts.filter(a => a.service_id === svc.id)
          
          return (
            <div key={svc.id}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{svc.icon}</span>
                <h2 className="text-sm font-bold uppercase tracking-widest">{svc.name}</h2>
                <span 
                  className="ml-auto text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: svc.color_to || '#a78bfa' }}
                >
                  {svcAccounts.length} account
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <span className="text-[0.78rem] text-text-muted mr-1">Ordina:</span>
                <button className="text-[0.75rem] font-bold px-3 py-1.5 rounded-full border bg-ag-from/15 text-ag-to border-ag-from/30 transition-all">
                  Prossimo reset
                </button>
                <button className="text-[0.75rem] font-bold px-3 py-1.5 rounded-full border bg-transparent text-text-secondary border-border hover:bg-white/5 transition-all">
                  Stato
                </button>
                <button className="text-[0.75rem] font-bold px-3 py-1.5 rounded-full border bg-transparent text-text-secondary border-border hover:bg-white/5 transition-all">
                  Nome
                </button>
              </div>

              {svcAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
                  <div className="text-4xl opacity-40 mb-3">{svc.icon}</div>
                  <p className="text-sm mb-4">Nessun account ancora.</p>
                  <Link href="?modal=add" className="px-3 py-1.5 bg-black/10 hover:bg-black/20 text-text-primary border border-border text-[0.8rem] rounded-md transition-colors block w-max mx-auto">
                    + Aggiungi il primo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {svcAccounts.map(acc => (
                    <AccountCard key={acc.id} account={acc} service={svc} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal === 'add' && <AddAccountModal services={services} />}
      {modal === 'edit' && id && <AddAccountModal services={services} accountToEdit={accounts.find(a => a.id === id)} />}
      {modal === 'settings' && <SettingsModal services={services} />}
    </>
  )
}
