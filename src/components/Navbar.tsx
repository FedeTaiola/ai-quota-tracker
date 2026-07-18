'use client'

import { Settings, Plus, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(
        n.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) +
          ' · ' +
          n.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    tick()
    const int = setInterval(tick, 1000)
    return () => clearInterval(int)
  }, [])

  return (
    <header className="flex flex-wrap items-center justify-between py-9 border-b border-border mb-9 gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] font-bold shadow-[0_0_24px_rgba(108,99,255,0.35)] bg-gradient-to-br from-ag-from to-cx-to text-white">
          AI
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">
            Quota Tracker
          </h1>
          <p className="text-xs text-text-muted mt-1 min-h-[16px]">{time}</p>
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap items-center">
        <button 
          onClick={() => document.documentElement.classList.toggle('light')}
          title="Cambia Tema"
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
        >
          <Sun className="w-5 h-5 hidden .light:block" />
          <Moon className="w-5 h-5 block .light:hidden" />
        </button>
        <Link 
          href="?modal=settings"
          title="Impostazioni Servizi"
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <Link 
          href="?modal=add"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-ag-from to-ag-to text-white text-sm font-bold rounded-lg shadow-[0_4px_14px_rgba(108,99,255,0.3)] hover:shadow-[0_6px_20px_rgba(108,99,255,0.5)] hover:-translate-y-[1px] transition-all"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Account
        </Link>
      </div>
    </header>
  )
}
