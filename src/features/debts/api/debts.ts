import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import type { Debt, DebtInput, DebtStatus } from '../types'

export const DEMO_DEBT_STORAGE_KEY = 'vi-nho.demo.debts.v1'
const COLUMNS = 'id,user_id,person,amount,direction,status,occurred_on,due_on,paid_on,note,created_at,updated_at'
type LegacyDebt = Omit<Debt, 'status' | 'occurred_on' | 'paid_on'> & { status: DebtStatus | 'open'; occurred_on?: string; paid_on?: string | null }
const normalize = (item: LegacyDebt): Debt => ({
  ...item,
  status: item.status === 'open' ? 'pending' : item.status,
  occurred_on: item.occurred_on ?? item.created_at.slice(0, 10),
  paid_on: item.paid_on ?? (item.status === 'paid' ? item.updated_at.slice(0, 10) : null),
})
const readDemo = () => (readLocalArray<LegacyDebt>(DEMO_DEBT_STORAGE_KEY) ?? []).map(normalize)

export const fetchDebts = async (userId: string) => {
  if (!isSupabaseConfigured) return readDemo().filter((item) => item.user_id === userId)
  const client = await getSupabaseClient()
  const { data, error } = await client.from('debts').select(COLUMNS).eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Debt[]
}
export const saveDebt = async (userId: string, input: DebtInput, editingId?: string) => {
  const clean = { ...input, person: input.person.trim(), note: input.note.trim() || null }
  if (!isSupabaseConfigured) {
    const items = readDemo(); const existing = editingId ? items.find((item) => item.id === editingId) : null; const now = new Date().toISOString()
    const saved: Debt = existing ? { ...existing, ...clean, updated_at: now } : { ...clean, id: crypto.randomUUID(), user_id: userId, status: 'pending', paid_on: null, created_at: now, updated_at: now }
    writeLocalArray(DEMO_DEBT_STORAGE_KEY, existing ? items.map((item) => item.id === editingId ? saved : item) : [saved, ...items])
    return saved
  }
  const client = await getSupabaseClient()
  const query = editingId ? client.from('debts').update(clean).eq('id', editingId) : client.from('debts').insert({ ...clean, user_id: userId })
  const { data, error } = await query.select(COLUMNS).single()
  if (error) throw error
  return data as Debt
}
export const setDebtStatus = async (id: string, status: DebtStatus) => {
  const paid_on = status === 'paid' ? new Date().toISOString().slice(0, 10) : null
  if (!isSupabaseConfigured) { let saved!: Debt; writeLocalArray(DEMO_DEBT_STORAGE_KEY, readDemo().map((item) => item.id === id ? (saved = { ...item, status, paid_on, updated_at: new Date().toISOString() }) : item)); return saved }
  const client = await getSupabaseClient(); const { data, error } = await client.from('debts').update({ status, paid_on }).eq('id', id).select(COLUMNS).single(); if (error) throw error; return data as Debt
}
export const removeDebt = async (id: string) => { if (!isSupabaseConfigured) return writeLocalArray(DEMO_DEBT_STORAGE_KEY, readDemo().filter((item) => item.id !== id)); const client = await getSupabaseClient(); const { error } = await client.from('debts').delete().eq('id', id); if (error) throw error }
