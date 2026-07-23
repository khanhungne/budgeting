import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { Brand } from '../../../components/ui/Brand'
import { Button } from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Alert'
import { useAuth } from '../AuthProvider'

type Mode = 'sign-in' | 'sign-up'

export const AuthScreen = () => {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (password.length < 8) {
      setMessage({ tone: 'error', text: 'Mật khẩu cần có ít nhất 8 ký tự.' })
      return
    }

    setBusy(true)
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password)
      } else {
        const needsConfirmation = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setMessage({
            tone: 'success',
            text: 'Đã tạo tài khoản. Hãy kiểm tra email để xác nhận rồi đăng nhập.',
          })
        }
      }
    } catch (reason) {
      setMessage({
        tone: 'error',
        text: reason instanceof Error ? reason.message : 'Không thể xác thực tài khoản.',
      })
    } finally {
      setBusy(false)
    }
  }

  const forgotPassword = async () => {
    if (!email.trim()) {
      setMessage({ tone: 'error', text: 'Nhập email trước khi yêu cầu đặt lại mật khẩu.' })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await resetPassword(email.trim())
      setMessage({ tone: 'success', text: 'Đã gửi liên kết đặt lại mật khẩu vào email.' })
    } catch (reason) {
      setMessage({
        tone: 'error',
        text: reason instanceof Error ? reason.message : 'Không gửi được email.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#f5f7f2] px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 flex items-center justify-between">
          <Brand />
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
            PWA
          </span>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(33,59,50,0.10)]">
          <div className="mb-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
              {mode === 'sign-in' ? 'Chào bạn trở lại' : 'Bắt đầu ngay'}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Dữ liệu được đồng bộ an toàn với tài khoản của riêng bạn.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {(
              [
                ['sign-in', 'Đăng nhập'],
                ['sign-up', 'Đăng ký'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value)
                  setMessage(null)
                }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === value ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-900/5">
                <Mail className="size-5 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ban@email.com"
                  className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-900/5">
                <LockKeyhole className="size-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-slate-400" />
                  ) : (
                    <Eye className="size-5 text-slate-400" />
                  )}
                </button>
              </span>
            </label>

            {message && (
              <Alert tone={message.tone} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <Button type="submit" fullWidth disabled={busy}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {mode === 'sign-in' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Button>
          </form>

          {mode === 'sign-in' && (
            <button
              type="button"
              onClick={() => void forgotPassword()}
              disabled={busy}
              className="mt-5 w-full text-center text-sm font-bold text-emerald-800 disabled:opacity-50"
            >
              Quên mật khẩu?
            </button>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Bằng cách tiếp tục, bạn đồng ý lưu dữ liệu thu chi trong project Supabase của ứng dụng.
        </p>
      </div>
    </main>
  )
}
