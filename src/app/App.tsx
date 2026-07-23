import { lazy, Suspense, useState } from 'react'
import { AppShell, type AppTab } from '../components/layout/AppShell'
import { PwaUpdateToast } from '../components/pwa/PwaUpdateToast'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { useAuth } from '../features/auth/AuthProvider'
import { AuthScreen } from '../features/auth/components/AuthScreen'
import { PasswordRecoveryScreen } from '../features/auth/components/PasswordRecoveryScreen'
import { useBudget } from '../features/budgets/hooks/useBudget'
import { useLotteryEntries } from '../features/lottery/hooks/useLotteryEntries'
import { useLotteryLimit } from '../features/lottery/hooks/useLotteryLimit'
import { TransactionForm } from '../features/transactions/components/TransactionForm'
import { useTransactions } from '../features/transactions/hooks/useTransactions'
import {
  useTransactionTrends,
  type TrendMonths,
} from '../features/transactions/hooks/useTransactionTrends'
import type { Transaction } from '../features/transactions/types'
import { useWallets } from '../features/wallets/hooks/useWallets'
import { currentMonth } from '../lib/dates'
import { isSupabaseConfigured } from '../lib/supabase'
import { DashboardPage } from '../pages/DashboardPage'

const AccountPage = lazy(() =>
  import('../pages/AccountPage').then((module) => ({ default: module.AccountPage })),
)
const LotteryPage = lazy(() =>
  import('../pages/LotteryPage').then((module) => ({ default: module.LotteryPage })),
)
const StatisticsPage = lazy(() =>
  import('../pages/StatisticsPage').then((module) => ({
    default: module.StatisticsPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('../pages/TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  })),
)

const DEMO_USER = {
  id: 'demo-local-user',
  email: 'demo@vinho.local',
}

export const App = () => {
  const { user, loading: authLoading, recoveryMode, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [trendMonths, setTrendMonths] = useState<TrendMonths>(6)

  const demoMode = !isSupabaseConfigured
  const activeUser = demoMode ? DEMO_USER : user
  const transactionState = useTransactions(activeUser?.id ?? '', month)
  const walletState = useWallets(activeUser?.id ?? '', activeTab === 'account')
  const budgetState = useBudget(activeUser?.id ?? '', month, activeTab === 'home')
  const lotteryState = useLotteryEntries(
    activeUser?.id ?? '',
    month,
    activeTab === 'lottery',
  )
  const lotteryLimitState = useLotteryLimit(
    activeUser?.id ?? '',
    month,
    activeTab === 'lottery',
  )
  const trendState = useTransactionTrends(
    activeUser?.id ?? '',
    month,
    trendMonths,
    transactionState.transactions,
    activeTab === 'statistics',
  )

  if (!demoMode && authLoading) return <LoadingScreen />
  if (!demoMode && recoveryMode) return <PasswordRecoveryScreen />
  if (!activeUser) return <AuthScreen />

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction)
    setFormOpen(true)
  }

  const confirmDelete = async (transaction: Transaction) => {
    const label = transaction.note || 'giao dịch này'
    if (window.confirm(`Xoá “${label}”? Thao tác này không thể hoàn tác.`)) {
      try {
        await transactionState.remove(transaction.id)
      } catch {
        // Hook đã đưa lỗi lên giao diện.
      }
    }
  }

  return (
    <>
      <AppShell activeTab={activeTab} onTabChange={setActiveTab} onAdd={openCreate}>
        <Suspense
          fallback={
            <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-5 h-56 animate-pulse rounded-[1.75rem] bg-slate-100" />
            </div>
          }
        >
        {activeTab === 'home' && (
          <DashboardPage
            user={activeUser}
            demoMode={demoMode}
            month={month}
            transactions={transactionState.transactions}
            wallets={walletState.wallets}
            loading={transactionState.loading}
            totals={transactionState.totals}
            budget={budgetState.budget}
            budgetLoading={budgetState.loading}
            budgetSaving={budgetState.saving}
            error={transactionState.error}
            onMonthChange={setMonth}
            onBudgetSave={budgetState.save}
            onViewAll={() => setActiveTab('transactions')}
            onEdit={openEdit}
            onDelete={(transaction) => void confirmDelete(transaction)}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsPage
            month={month}
            transactions={transactionState.transactions}
            wallets={walletState.wallets}
            loading={transactionState.loading}
            onMonthChange={setMonth}
            onEdit={openEdit}
            onDelete={(transaction) => void confirmDelete(transaction)}
          />
        )}
        {activeTab === 'lottery' && (
          <LotteryPage
            month={month}
            entries={lotteryState.entries}
            loading={lotteryState.loading}
            saving={lotteryState.saving}
            error={lotteryState.error}
            stats={lotteryState.stats}
            limit={lotteryLimitState.limit}
            limitLoading={lotteryLimitState.loading}
            limitSaving={lotteryLimitState.saving}
            limitError={lotteryLimitState.error}
            onMonthChange={setMonth}
            onSave={lotteryState.save}
            onRemove={lotteryState.remove}
            onLimitSave={lotteryLimitState.save}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsPage
            month={month}
            transactions={transactionState.transactions}
            totals={transactionState.totals}
            loading={transactionState.loading}
            trends={trendState.trends}
            trendsLoading={trendState.loading}
            trendMonths={trendMonths}
            onTrendMonthsChange={setTrendMonths}
            onMonthChange={setMonth}
          />
        )}
        {activeTab === 'account' && (
          <AccountPage
            user={activeUser}
            demoMode={demoMode}
            onSignOut={demoMode ? undefined : signOut}
            onDemoDataChanged={() => {
              void transactionState.refresh()
              void budgetState.refresh()
              void lotteryState.refresh()
              void lotteryLimitState.refresh()
              void walletState.refresh()
              void trendState.refresh()
            }}
            wallets={walletState.wallets}
            walletBalances={walletState.balances}
            walletsLoading={walletState.loading}
            walletsSaving={walletState.saving}
            walletsError={walletState.error}
            onWalletSave={walletState.save}
            onWalletToggle={walletState.toggleArchived}
          />
        )}
        </Suspense>
      </AppShell>

      <TransactionForm
        open={formOpen}
        month={month}
        editing={editing}
        saving={transactionState.saving}
        wallets={walletState.wallets}
        onClose={() => setFormOpen(false)}
        onSave={async (input, editingId) => {
          await transactionState.save(input, editingId)
          if (activeTab === 'account') await walletState.refreshBalances()
          if (activeTab === 'statistics') await trendState.refresh()
        }}
      />
      <PwaUpdateToast />
    </>
  )
}
