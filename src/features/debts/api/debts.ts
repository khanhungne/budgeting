import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import { normalizeDebtAvatar } from '../avatars'
import type { Debt, DebtInput, DebtStatus } from '../types'

export const DEMO_DEBT_STORAGE_KEY = 'vi-nho.demo.debts.v1'

const COLUMNS =
  'id,user_id,person,avatar,amount,direction,status,occurred_on,due_on,paid_on,note,created_at,updated_at'
const LEGACY_COLUMNS =
  'id,user_id,person,amount,direction,status,occurred_on,due_on,paid_on,note,created_at,updated_at'

type LegacyDebt = Omit<Debt, 'avatar' | 'status' | 'occurred_on' | 'paid_on'> & {
  avatar?: string
  status: DebtStatus | 'open'
  occurred_on?: string
  paid_on?: string | null
}

type DatabaseError = { code?: string; message?: string }

const missingAvatarColumn = (error: DatabaseError | null) =>
  Boolean(
    error &&
      (error.code === '42703' ||
        error.code === 'PGRST204' ||
        error.message?.toLocaleLowerCase('en').includes('avatar')),
  )

const normalize = (item: LegacyDebt): Debt => ({
  ...item,
  avatar: normalizeDebtAvatar(item.avatar, item.person),
  status: item.status === 'open' ? 'pending' : item.status,
  occurred_on: item.occurred_on ?? item.created_at.slice(0, 10),
  paid_on: item.paid_on ?? (item.status === 'paid' ? item.updated_at.slice(0, 10) : null),
})

const readDemo = () =>
  (readLocalArray<LegacyDebt>(DEMO_DEBT_STORAGE_KEY) ?? []).map(normalize)

export const fetchDebts = async (userId: string) => {
  if (!isSupabaseConfigured) return readDemo().filter((item) => item.user_id === userId)

  const client = await getSupabaseClient()
  const response = await client
    .from('debts')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!response.error) return (response.data ?? []).map((item) => normalize(item as LegacyDebt))
  if (!missingAvatarColumn(response.error)) throw response.error

  const legacyResponse = await client
    .from('debts')
    .select(LEGACY_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (legacyResponse.error) throw legacyResponse.error
  return (legacyResponse.data ?? []).map((item) => normalize(item as LegacyDebt))
}

export const saveDebt = async (userId: string, input: DebtInput, editingId?: string) => {
  const clean = {
    ...input,
    person: input.person.trim(),
    avatar: normalizeDebtAvatar(input.avatar, input.person),
    note: input.note.trim() || null,
  }

  if (!isSupabaseConfigured) {
    const items = readDemo()
    const existing = editingId ? items.find((item) => item.id === editingId) : null
    const now = new Date().toISOString()
    const saved: Debt = existing
      ? { ...existing, ...clean, updated_at: now }
      : {
          ...clean,
          id: crypto.randomUUID(),
          user_id: userId,
          status: 'pending',
          paid_on: null,
          created_at: now,
          updated_at: now,
        }
    writeLocalArray(
      DEMO_DEBT_STORAGE_KEY,
      existing
        ? items.map((item) => (item.id === editingId ? saved : item))
        : [saved, ...items],
    )
    return saved
  }

  const client = await getSupabaseClient()
  const saveWithColumns = (payload: Record<string, unknown>, columns: string) =>
    editingId
      ? client.from('debts').update(payload).eq('id', editingId).select(columns).single()
      : client.from('debts').insert({ ...payload, user_id: userId }).select(columns).single()

  const response = await saveWithColumns(clean, COLUMNS)
  if (!response.error) return normalize(response.data as unknown as LegacyDebt)
  if (!missingAvatarColumn(response.error)) throw response.error

  const { avatar, ...legacyClean } = clean
  const legacyResponse = await saveWithColumns(legacyClean, LEGACY_COLUMNS)
  if (legacyResponse.error) throw legacyResponse.error
  return normalize({ ...(legacyResponse.data as unknown as LegacyDebt), avatar })
}

export const setDebtStatus = async (id: string, status: DebtStatus) => {
  const paid_on = status === 'paid' ? new Date().toISOString().slice(0, 10) : null

  if (!isSupabaseConfigured) {
    let saved!: Debt
    writeLocalArray(
      DEMO_DEBT_STORAGE_KEY,
      readDemo().map((item) =>
        item.id === id
          ? (saved = { ...item, status, paid_on, updated_at: new Date().toISOString() })
          : item,
      ),
    )
    return saved
  }

  const client = await getSupabaseClient()
  const response = await client
    .from('debts')
    .update({ status, paid_on })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (!response.error) return normalize(response.data as LegacyDebt)
  if (!missingAvatarColumn(response.error)) throw response.error

  const legacyResponse = await client
    .from('debts')
    .update({ status, paid_on })
    .eq('id', id)
    .select(LEGACY_COLUMNS)
    .single()
  if (legacyResponse.error) throw legacyResponse.error
  return normalize(legacyResponse.data as LegacyDebt)
}

export const removeDebt = async (id: string) => {
  if (!isSupabaseConfigured) {
    return writeLocalArray(
      DEMO_DEBT_STORAGE_KEY,
      readDemo().filter((item) => item.id !== id),
    )
  }
  const client = await getSupabaseClient()
  const { error } = await client.from('debts').delete().eq('id', id)
  if (error) throw error
}
