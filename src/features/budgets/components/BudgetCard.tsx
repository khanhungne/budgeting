import { Target } from 'lucide-react'
import { MonthlyLimitCard } from '../../../components/ui/MonthlyLimitCard'
import type { MonthlyBudget } from '../types'

type BudgetCardProps = {
  budget: MonthlyBudget | null
  expense: number
  loading: boolean
  saving: boolean
  onSave: (amount: number) => Promise<void>
}

export const BudgetCard = ({
  budget,
  expense,
  loading,
  saving,
  onSave,
}: BudgetCardProps) => (
  <MonthlyLimitCard
    amount={Number(budget?.amount ?? 0)}
    used={expense}
    loading={loading}
    saving={saving}
    tone="amber"
    icon={Target}
    eyebrow="Ngân sách tháng"
    emptyAction="Đặt giới hạn chi tiêu"
    placeholder="Ví dụ: 5.000.000"
    usageLabel="Đã chi"
    invalidMessage="Ngân sách VND không hợp lệ hoặc quá lớn."
    saveErrorMessage="Không lưu được ngân sách."
    onSave={onSave}
  />
)
