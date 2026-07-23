import type { WalletKind } from './types'

export const DEMO_DEFAULT_WALLET_ID = 'demo-wallet-cash'

export const WALLET_KIND_LABELS: Record<WalletKind, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  other: 'Khác',
}

export const WALLET_KIND_EMOJI: Record<WalletKind, string> = {
  cash: '💵',
  bank: '🏦',
  ewallet: '📱',
  other: '👝',
}

export const WALLET_COLORS = ['#1c5f50', '#377d9b', '#7c4bb3', '#d27a3f', '#b94f64', '#667085']
