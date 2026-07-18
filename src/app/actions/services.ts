'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Service = {
  id: string
  name: string
  icon: string | null
  color_from: string | null
  color_to: string | null
  free_days: number
  pro_days: number
  created_at?: string
}

export async function getServices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  return data as Service[]
}

export async function createService(serviceData: Omit<Service, 'created_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()
    .single()

  if (error) {
    console.error('Error creating service:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { data }
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
