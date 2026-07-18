'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Account = {
  id: string
  service_id: string
  plan: 'free' | 'pro'
  name: string
  email: string | null
  notes: string | null
  cycle_started_at: string
  quota_status: 'available' | 'exhausted'
  quota_percent: number
  created_at?: string
}

export async function getAccounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }
  return data as Account[]
}

export async function createAccount(accountData: Omit<Account, 'created_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .insert([accountData])
    .select()
    .single()

  if (error) {
    console.error('Error creating account:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { data }
}

export async function updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'created_at'>>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating account:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { data }
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting account:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function markQuotaExhausted(id: string) {
  return updateAccount(id, { quota_status: 'exhausted', quota_percent: 0 })
}

export async function markQuotaAvailable(id: string) {
  return updateAccount(id, { quota_status: 'available', quota_percent: 100 })
}

export async function renewCycle(id: string) {
  // We just set the cycle_started_at to now, and restore the quota
  return updateAccount(id, { 
    cycle_started_at: new Date().toISOString(),
    quota_status: 'available',
    quota_percent: 100
  })
}
