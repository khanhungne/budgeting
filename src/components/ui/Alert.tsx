import { AlertCircle, CheckCircle2, X } from 'lucide-react'

type AlertProps = {
  tone?: 'error' | 'success'
  children: string
  onClose?: () => void
}

export const Alert = ({ tone = 'error', children, onClose }: AlertProps) => (
  <div
    className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
      tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
    }`}
    role="status"
  >
    {tone === 'error' ? (
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
    ) : (
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
    )}
    <span className="flex-1">{children}</span>
    {onClose && (
      <button type="button" onClick={onClose} aria-label="Đóng thông báo">
        <X className="size-4" />
      </button>
    )}
  </div>
)
