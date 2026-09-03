export const DEBT_AVATARS = [
  '🐣',
  '🐼',
  '🦊',
  '🐸',
  '🐰',
  '🐻',
  '🐯',
  '🐧',
  '🐨',
  '🐹',
  '🐶',
  '🐱',
  '🦁',
  '🐮',
  '🐵',
  '🦄',
] as const

export type DebtAvatar = (typeof DEBT_AVATARS)[number]

export const defaultDebtAvatar = (person = '') => {
  if (!person.trim()) return DEBT_AVATARS[0]
  const index = [...person.trim().toLocaleLowerCase('vi')].reduce(
    (total, character) => total + (character.codePointAt(0) ?? 0),
    0,
  )
  return DEBT_AVATARS[index % DEBT_AVATARS.length]
}

export const normalizeDebtAvatar = (avatar: unknown, person = '') =>
  typeof avatar === 'string' && avatar.trim() ? avatar.trim() : defaultDebtAvatar(person)
