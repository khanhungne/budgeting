import { Gauge } from 'lucide-react'
import { MonthlyLimitCard } from '../../../components/ui/MonthlyLimitCard'
import type { LotteryMonthlyLimit } from '../limitTypes'

type LotteryLimitCardProps = {
  limit: LotteryMonthlyLimit | null
  stake: number
  loading: boolean
  saving: boolean
  onSave: (amount: number) => Promise<void>
}

export const LotteryLimitCard = ({
  limit,
  stake,
  loading,
  saving,
  onSave,
}: LotteryLimitCardProps) => (
  <MonthlyLimitCard
    amount={Number(limit?.amount ?? 0)}
    used={stake}
    loading={loading}
    saving={saving}
    tone="violet"
    icon={Gauge}
    eyebrow="Hạn mức tự đặt"
    emptyAction="Đặt trần tiền vào mỗi tháng"
    placeholder="Ví dụ: 500.000"
    usageLabel="Tổng tiền vào tháng này:"
    invalidMessage="Hạn mức VND không hợp lệ hoặc quá lớn."
    saveErrorMessage="Không lưu được hạn mức."
    overLabel="Đã vượt"
    onSave={onSave}
  />
)
