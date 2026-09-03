import { normalizeDebtAvatar } from './avatars'
import type { Debt, DebtDirection } from './types'

export type DebtPersonSummary = {
  person: string
  avatar: string
  direction: DebtDirection
  total: number
  count: number
  overdueCount: number
  nearestDue: string | null
}

const personKey = (value: string) => value.trim().toLocaleLowerCase('vi')

export const summarizeDebtPeople = (
  debts: Debt[],
  today: string,
  direction?: DebtDirection,
): DebtPersonSummary[] => {
  const groups = new Map<string, DebtPersonSummary>()

  for (const debt of debts) {
    if (debt.status !== 'pending' || (direction && debt.direction !== direction)) continue
    const key = `${debt.direction}:${personKey(debt.person)}`
    const current = groups.get(key) ?? {
      person: debt.person.trim(),
      avatar: normalizeDebtAvatar(debt.avatar, debt.person),
      direction: debt.direction,
      total: 0,
      count: 0,
      overdueCount: 0,
      nearestDue: null,
    }
    current.total += Number(debt.amount)
    current.count += 1
    if (debt.due_on && debt.due_on < today) current.overdueCount += 1
    if (debt.due_on && (!current.nearestDue || debt.due_on < current.nearestDue)) {
      current.nearestDue = debt.due_on
    }
    groups.set(key, current)
  }

  return [...groups.values()].sort((a, b) => {
    if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount
    if (a.nearestDue && b.nearestDue) return a.nearestDue.localeCompare(b.nearestDue)
    if (a.nearestDue) return -1
    if (b.nearestDue) return 1
    return b.total - a.total
  })
}

export const summarizePeopleIOwe = (debts: Debt[], today: string) =>
  summarizeDebtPeople(debts, today, 'i_owe')
