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
import { CategoryManager } from '../features/transactions/components/CategoryManager'
import type { CategoryInput, StoredCategory } from '../features/transactions/api/categories'
import { NotificationSettings } from '../features/notifications/components/NotificationSettings'

type AccountPageProps = {
  user: { id?: string; email?: string }
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
  categories: StoredCategory[]
  categoriesLoading: boolean
  categoriesSaving: boolean
  categoriesError: string | null
  onCategorySave: (input: CategoryInput, editingId?: string) => Promise<StoredCategory>
  onCategoryRemove: (id: string) => Promise<void>
}

const AccountSectionHeading = ({
  eyebrow,
  title,
  emoji,
}: {
  eyebrow: string
  title: string
  emoji: string
}) => (
  <div className="mt-8 flex items-center gap-3 px-1">
    <span className="grid size-10 -rotate-3 place-items-center rounded-2xl bg-amber-100 text-xl shadow-sm">
      {emoji}
    </span>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-0.5 text-lg font-black text-slate-900">{title}</h2>
    </div>
  </div>
)

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
  categories,
  categoriesLoading,
  categoriesSaving,
  categoriesError,
  onCategorySave,
  onCategoryRemove,
}: AccountPageProps) => {
  const { canInstall, installed, isIos, install } = usePwaInstall()
  const online = useOnlineStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeWalletCount = wallets.filter((wallet) => !wallet.is_archived).length
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

      <section className="relative mt-7 overflow-hidden rounded-[2rem] bg-emerald-950 p-5 text-white shadow-[0_18px_40px_rgba(10,70,57,0.2)]">
        <span className="absolute -right-5 -top-7 size-28 rounded-full bg-amber-300/15" />
        <span className="absolute -bottom-12 left-16 size-28 rounded-full bg-emerald-300/10" />
        <div className="relative flex items-center gap-4">
          <span className="relative grid size-16 shrink-0 -rotate-3 place-items-center rounded-[1.4rem] border border-white/20 bg-[#ffdda0] text-4xl shadow-[0_7px_0_#bd792c]">
            🐻
            <span className="absolute -bottom-2 -right-2 grid size-7 rotate-3 place-items-center rounded-full border-2 border-emerald-950 bg-white text-[9px] font-black text-emerald-900">
              {getInitials(user.email)}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
              {demoMode ? 'Góc dùng thử' : 'Góc của mình'}
            </p>
            <p className="mt-1 truncate text-lg font-black">
              {demoMode ? 'Dữ liệu trên máy này' : user.email}
            </p>
            <p className="mt-1 text-xs text-emerald-100/65">Mọi cài đặt của Ví Nhỏ ở một chỗ.</p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold">
            {demoMode ? <HardDrive className="size-3.5" /> : <Cloud className="size-3.5" />}
            {demoMode ? 'Lưu trên máy' : 'Đã đồng bộ'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold">
            {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {online ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
          </span>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Đi nhanh đến
            </p>
            <h2 className="mt-0.5 text-lg font-black text-slate-900">Bạn muốn chỉnh gì?</h2>
          </div>
          <span className="rotate-3 text-2xl">✨</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { target: 'account-wallets', emoji: '👛', label: 'Ví của mình', value: `${activeWalletCount} ví đang dùng`, tone: 'bg-sky-50 border-sky-100' },
            { target: 'account-categories', emoji: '🎨', label: 'Danh mục', value: `${categories.length} mục`, tone: 'bg-orange-50 border-orange-100' },
            { target: 'account-notifications', emoji: '🔔', label: 'Nhắc nhở', value: 'Chọn giờ nhắc', tone: 'bg-amber-50 border-amber-100' },
            { target: 'account-install', emoji: '📱', label: 'Ứng dụng', value: installed ? 'Đã cài PWA' : 'Cài lên máy', tone: 'bg-emerald-50 border-emerald-100' },
          ].map((item, index) => (
            <button
              key={item.target}
              type="button"
              onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`flex min-h-24 min-w-0 items-center gap-3 overflow-hidden rounded-[1.4rem] border p-3 text-left shadow-[0_5px_0_rgba(15,23,42,0.05)] ${item.tone} ${index % 2 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]'}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {item.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-800">{item.label}</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
                  {item.value}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <AccountSectionHeading eyebrow="Sổ tiền" title="Quản lý dữ liệu dùng chung" emoji="🧺" />

      <div id="account-wallets" className="scroll-mt-5">
        <WalletManager
          wallets={wallets}
          balances={walletBalances}
          loading={walletsLoading}
          saving={walletsSaving}
          error={walletsError}
          onSave={onWalletSave}
          onToggleArchived={onWalletToggle}
        />
      </div>

      <div id="account-categories" className="scroll-mt-5">
        <CategoryManager
          categories={categories}
          loading={categoriesLoading}
          saving={categoriesSaving}
          error={categoriesError}
          onSave={onCategorySave}
          onRemove={onCategoryRemove}
        />
      </div>

      <AccountSectionHeading eyebrow="Trên điện thoại" title="Cài ứng dụng và lời nhắc" emoji="🐣" />

      <section id="account-install" className="mt-5 scroll-mt-5 rounded-[1.75rem] bg-emerald-950 p-5 text-white">
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

      <div id="account-notifications" className="scroll-mt-5">
        <NotificationSettings userId={user.id ?? ''} demoMode={demoMode} />
      </div>

      <AccountSectionHeading eyebrow="An toàn" title="Tài khoản và dữ liệu" emoji="🔐" />

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
