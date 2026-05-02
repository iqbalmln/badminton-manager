'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/auth'
import type { Player } from '@/types/database'

export async function getPlayers(): Promise<Player[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function createPlayer(formData: FormData) {
  await requireAdmin()
  const name = formData.get('name') as string
  const level = Number(formData.get('level'))

  if (!name?.trim()) throw new Error('Nama pemain wajib diisi')
  if (level < 1 || level > 10) throw new Error('Level harus antara 1–10')

  const supabase = createServiceClient()
  const { error } = await supabase.from('players').insert({ name: name.trim(), level })

  if (error) throw new Error(error.message)
  revalidatePath('/players')
}

export async function updatePlayer(id: string, formData: FormData) {
  await requireAdmin()
  const name = formData.get('name') as string
  const level = Number(formData.get('level'))

  if (!name?.trim()) throw new Error('Nama pemain wajib diisi')
  if (level < 1 || level > 10) throw new Error('Level harus antara 1–10')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('players')
    .update({ name: name.trim(), level })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/players')
}

export async function togglePlayerActive(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('players')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/players')
}

export async function deletePlayer(id: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase.from('players').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/players')
}
