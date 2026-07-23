import {
  BarChart3,
  CircleUserRound,
  Home,
  List,
  Plus,
  TicketCheck,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'

export type AppTab = 'home' | 'transactions' | 'lottery' | 'statistics' | 'account'

type AppShellProps = PropsWithChildren<{
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  onAdd: () => void
}>

const items = [
  { id: 'home' as const, label: 'Tổng quan', icon: Home },
  { id: 'transactions' as const, label: 'Giao dịch', icon: List },
  { id: 'lottery' as const, label: 'Lô đề', icon: TicketCheck },
  { id: 'statistics' as const, label: 'Thống kê', icon: BarChart3 },
  { id: 'account' as const, label: 'Tài khoản', icon: CircleUserRound },
]

export const AppShell = ({ children, activeTab, onTabChange, onAdd }: AppShellProps) => (
  <main className="min-h-dvh bg-[#f5f7f2]">
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-[calc(9rem+env(safe-area-inset-bottom))]">
      {children}
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(33,59,50,0.08)] backdrop-blur-lg">
      <button
        type="button"
        onClick={onAdd}
        className="absolute left-1/2 top-0 grid size-14 -translate-x-1/2 -translate-y-[110%] place-items-center rounded-2xl border-4 border-[#f5f7f2] bg-[#efb44d] text-emerald-950 shadow-lg transition active:scale-95"
        aria-label="Thêm giao dịch thu chi"
      >
        <Plus className="size-6" strokeWidth={3} />
      </button>

      <div className="grid h-[74px] grid-cols-5 items-center">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-bold transition ${
              activeTab === id ? 'text-emerald-900' : 'text-slate-400'
            }`}
          >
            <Icon className="size-5" strokeWidth={activeTab === id ? 2.7 : 2} />
            <span className="max-w-full truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  </main>
)
