import { Bell, BellOff, Clock, Send } from 'lucide-react'
import { usePwaInstall } from '../../../hooks/usePwaInstall'
import { useDailyNotifications } from '../hooks/useDailyNotifications'

type NotificationSettingsProps = {
  userId: string
  demoMode?: boolean
}

export const NotificationSettings = ({ userId, demoMode = false }: NotificationSettingsProps) => {
  const { installed, isIos } = usePwaInstall()
  const notifications = useDailyNotifications(userId, !demoMode)
  const iosNeedsInstall = isIos && !installed

  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100">
          {notifications.enabled ? (
            <Bell className="size-5 text-amber-700" />
          ) : (
            <BellOff className="size-5 text-slate-500" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Thông báo
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-900">Nhắc ghi thu chi mỗi ngày</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Nhận lời nhắc ngay cả khi Ví Nhỏ đang đóng.
          </p>
        </div>
      </div>

      {demoMode ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Hãy kết nối và đăng nhập Supabase để dùng thông báo trên điện thoại.
        </p>
      ) : !notifications.supported ? (
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
          Trình duyệt này chưa hỗ trợ Web Push.
        </p>
      ) : iosNeedsInstall ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Trên iPhone, hãy chọn Safari → Chia sẻ → Thêm vào Màn hình chính, sau đó mở Ví Nhỏ từ biểu tượng vừa cài.
        </p>
      ) : !notifications.configured ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Máy chủ chưa được cấu hình VAPID public key.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Clock className="size-5 text-emerald-700" />
            <label className="flex min-w-0 flex-1 items-center justify-between gap-3 text-sm font-bold text-slate-700">
              Giờ nhắc
              <input
                type="time"
                value={notifications.reminderTime}
                disabled={notifications.loading || notifications.saving}
                onChange={(event) => void notifications.updateTime(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {notifications.deviceCount} thiết bị đã đăng ký
            {notifications.currentDeviceRegistered ? ' · Máy này đã đăng ký' : ''}
          </p>

          {notifications.permission === 'denied' && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              Quyền thông báo đang bị chặn. Hãy mở Cài đặt của điện thoại và cho phép thông báo cho Ví Nhỏ.
            </p>
          )}

          {notifications.error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              {notifications.error}
            </p>
          )}
          {notifications.message && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
              {notifications.message}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={notifications.loading || notifications.saving || notifications.permission === 'denied'}
              onClick={() =>
                void (notifications.enabled && notifications.currentDeviceRegistered
                  ? notifications.disable()
                  : notifications.enable())
              }
              className="h-12 rounded-2xl bg-emerald-950 px-3 text-xs font-black text-white disabled:opacity-50"
            >
              {notifications.enabled && notifications.currentDeviceRegistered
                ? 'Tắt nhắc nhở'
                : notifications.enabled
                  ? 'Bật trên máy này'
                  : 'Bật nhắc nhở'}
            </button>
            <button
              type="button"
              disabled={
                notifications.loading ||
                notifications.saving ||
                !notifications.currentDeviceRegistered
              }
              onClick={() => void notifications.sendTest()}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-100 px-3 text-xs font-black text-amber-900 disabled:opacity-50"
            >
              <Send className="size-4" /> Gửi thử
            </button>
          </div>
        </>
      )}
    </section>
  )
}
