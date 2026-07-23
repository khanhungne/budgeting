import { useState, type FormEvent } from 'react'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { Alert } from '../../../components/ui/Alert'
import { Brand } from '../../../components/ui/Brand'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../AuthProvider'

export const PasswordRecoveryScreen = () => {
  const { updatePassword, clearRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Mật khẩu mới cần có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmation) {
      setError('Hai mật khẩu chưa giống nhau.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không đổi được mật khẩu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f7f2] px-5 py-8">
      <div className="w-full max-w-md">
        <Brand />
        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(33,59,50,0.10)]">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <KeyRound className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Đặt mật khẩu mới</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Chọn mật khẩu mới có ít nhất 8 ký tự cho tài khoản của bạn.
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu mới"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-700"
            />
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-700"
            />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" fullWidth disabled={busy}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              Cập nhật mật khẩu
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={clearRecovery}>
              Để sau
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
