import { useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export const PwaUpdateToast = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const timer = window.setTimeout(() => setOfflineReady(false), 5000)
    return () => window.clearTimeout(timer)
  }, [needRefresh, offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed inset-x-4 bottom-36 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 size-5 shrink-0 text-emerald-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {needRefresh ? 'Có phiên bản mới' : 'Ứng dụng đã sẵn sàng offline'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {needRefresh
              ? 'Cập nhật để dùng phiên bản mới nhất.'
              : 'Giao diện có thể mở lại khi mất mạng; dữ liệu vẫn cần kết nối Supabase.'}
          </p>
          {needRefresh && (
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="mt-3 rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-emerald-950"
            >
              Cập nhật ngay
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setNeedRefresh(false)
            setOfflineReady(false)
          }}
          aria-label="Đóng"
        >
          <X className="size-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
