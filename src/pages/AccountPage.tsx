import { useRef, useState, type ChangeEvent } from 'react'
import {
  Cloud,
  Download,
  ExternalLink,
  FileDown,
  LogOut,
  HardDrive,
  Mail,
  Share,
  ShieldCheck,
  Smartphone,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Brand } from '../components/ui/Brand'
import { exportDemoBackup, importDemoBackup } from '../features/backup/demoBackup'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { getInitials } from '../lib/format'
import { WalletManager } from '../features/wallets/components/WalletManager'
import type { Wallet, WalletInput } from '../features/wallets/types'

type AccountPageProps = {
  user: { email?: string }
  demoMode?: boolean
  onSignOut?: () => Promise<void>
  onDemoDataChanged?: () => void
  wallets: Wallet[]
  walletBalances: Record<string, number>
  walletsLoading: boolean
  walletsSaving: boolean
  walletsError: string | null
  onWalletSave: (input: WalletInput, editingId?: string) => Promise<void>
  onWalletToggle: (id: string, archived: boolean) => Promise<void>
}

export const AccountPage = ({
  user,
  demoMode = false,
  onSignOut,
  onDemoDataChanged,
  wallets,
  walletBalances,
  walletsLoading,
  walletsSaving,
  walletsError,
  onWalletSave,
  onWalletToggle,
}: AccountPageProps) => {
  const { canInstall, installed, isIos, install } = usePwaInstall()
  const online = useOnlineStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backupMessage, setBackupMessage] = useState<{
    tone: 'success' | 'error'
    text: string
  } | null>(null)

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm('Nhập backup sẽ thay thế toàn bộ dữ liệu demo hiện tại. Tiếp tục?')) {
      return
    }

    setBackupMessage(null)
    try {
      const result = await importDemoBackup(file)
      setBackupMessage({
        tone: 'success',
        text: `Đã khôi phục ${result.transactionCount} giao dịch, ${result.walletCount} ví, ${result.budgetCount} ngân sách và ${result.lotteryCount} bản ghi lô đề.`,
      })
      onDemoDataChanged?.()
    } catch (reason) {
      setBackupMessage({
        tone: 'error',
        text: reason instanceof Error ? reason.message : 'Không nhập được file backup.',
      })
    }
  }

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Brand compact />

      <section className="mt-7 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-lg font-black text-emerald-900">
            {getInitials(user.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              {demoMode ? 'Chế độ dùng thử' : 'Tài khoản'}
            </p>
            <p className="mt-1 truncate font-extrabold text-slate-900">
              {demoMode ? 'Dữ liệu trên máy này' : user.email}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            {demoMode ? (
              <HardDrive className="size-5 text-amber-700" />
            ) : (
              <Cloud className="size-5 text-emerald-700" />
            )}
            <p className="mt-2 text-xs font-bold text-slate-700">
              {demoMode ? 'Lưu local' : 'Đã đồng bộ'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {demoMode ? 'localStorage' : 'Supabase Cloud'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            {online ? (
              <Wifi className="size-5 text-emerald-700" />
            ) : (
              <WifiOff className="size-5 text-orange-600" />
            )}
            <p className="mt-2 text-xs font-bold text-slate-700">
              {online ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Trạng thái mạng</p>
          </div>
        </div>
      </section>

      <WalletManager
        wallets={wallets}
        balances={walletBalances}
        loading={walletsLoading}
        saving={walletsSaving}
        error={walletsError}
        onSave={onWalletSave}
        onToggleArchived={onWalletToggle}
      />

      <section className="mt-5 rounded-[1.75rem] bg-emerald-950 p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10">
            <Smartphone className="size-5 text-emerald-200" />
          </span>
          <div>
            <h2 className="font-black">
              {installed ? 'Đã cài trên màn hình chính' : 'Cài Ví Nhỏ lên điện thoại'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-emerald-100/70">
              {installed
                ? 'Bạn đang dùng ứng dụng ở chế độ standalone.'
                : isIos
                  ? 'Trên Safari, chọn Chia sẻ rồi chọn “Thêm vào MH chính”.'
                  : 'Mở nhanh như ứng dụng, không cần App Store.'}
            </p>
          </div>
        </div>

        {!installed && canInstall && (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#efb44d] py-3 text-sm font-black text-emerald-950"
          >
            <Download className="size-4" /> Cài ứng dụng
          </button>
        )}

        {!installed && isIos && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold">
            <Share className="size-4" /> Safari → Chia sẻ → Thêm vào MH chính
          </div>
        )}
      </section>

      {demoMode && (
        <>
          <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Sao lưu dữ liệu
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Export / Import</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Tải file JSON về máy để tránh mất dữ liệu khi trình duyệt bị xoá bộ nhớ.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  exportDemoBackup()
                  setBackupMessage({ tone: 'success', text: 'Đã tạo file backup VND.' })
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-950 text-xs font-black text-white"
              >
                <FileDown className="size-4" /> Xuất backup
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-xs font-black text-slate-700"
              >
                <Upload className="size-4" /> Nhập backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void importBackup(event)}
                className="hidden"
              />
            </div>
            {backupMessage && (
              <p
                className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                  backupMessage.tone === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {backupMessage.text}
              </p>
            )}
          </section>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Dữ liệu demo chỉ nằm trong trình duyệt này và chưa tự chuyển sang Supabase. Hãy
            xuất backup trước khi xoá dữ liệu trình duyệt.
          </div>
        </>
      )}

      <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        {[
          demoMode
            ? {
                icon: HardDrive,
                label: 'Nơi lưu dữ liệu',
                value: 'Chỉ trong trình duyệt của máy này',
              }
            : { icon: Mail, label: 'Email đăng nhập', value: user.email ?? '' },
          demoMode
            ? {
                icon: ShieldCheck,
                label: 'Kết nối Supabase',
                value: 'Sẽ bật sau khi thêm .env.local',
              }
            : { icon: ShieldCheck, label: 'Bảo vệ dữ liệu', value: 'RLS theo tài khoản' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0"
          >
            <Icon className="size-5 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700">{label}</p>
              <p className="truncate text-xs text-slate-400">{value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-5 space-y-3">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() =>
            window.open('https://supabase.com/docs/guides/auth', '_blank', 'noopener')
          }
        >
          Tìm hiểu về bảo mật
          <ExternalLink className="size-4" />
        </Button>
        {!demoMode && onSignOut && (
          <Button type="button" variant="danger" fullWidth onClick={() => void onSignOut()}>
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        )}
      </div>
    </div>
  )
}
