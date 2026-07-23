import { CheckCircle2, Copy, ExternalLink, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Brand } from '../components/ui/Brand'
import { Button } from '../components/ui/Button'

const example = `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY`

export const ConfigurationPage = () => {
  const [copied, setCopied] = useState(false)

  const copyExample = async () => {
    await navigator.clipboard.writeText(example)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-dvh bg-[#f5f7f2] px-5 py-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg">
        <Brand />
        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(33,59,50,0.10)]">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <Settings2 className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Cần kết nối Supabase</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Code đã sẵn sàng. Làm bốn bước sau rồi khởi động lại ứng dụng.
          </p>

          <ol className="mt-6 space-y-4">
            {[
              'Tạo một project mới trong Supabase.',
              'Chạy file supabase/schema.sql trong SQL Editor.',
              'Mở Project → Connect và lấy Project URL cùng Publishable key.',
              'Tạo file .env.local tại thư mục gốc và dán hai giá trị.',
            ].map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-xs text-slate-200">
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono leading-6">{example}</pre>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void copyExample()}
            >
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Đã sao chép' : 'Sao chép mẫu'}
            </Button>
            <Button
              type="button"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank', 'noopener')}
            >
              Mở Supabase
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
