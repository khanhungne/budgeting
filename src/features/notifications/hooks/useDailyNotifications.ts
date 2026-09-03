import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getCurrentPushSubscription,
  loadNotificationPreference,
  saveNotificationPreference,
  sendTestNotification,
  subscribeCurrentDevice,
  vapidPublicKey,
} from '../api/notifications'

const DEFAULT_TIME = '20:00'

export const useDailyNotifications = (userId: string, active: boolean) => {
  const supported = useMemo(
    () =>
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window,
    [],
  )
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState(DEFAULT_TIME)
  const [deviceCount, setDeviceCount] = useState(0)
  const [currentDeviceRegistered, setCurrentDeviceRegistered] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'default',
  )
  const [loading, setLoading] = useState(active)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!active || !userId || !supported) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [{ preference, deviceCount: count }, subscription] = await Promise.all([
        loadNotificationPreference(userId),
        getCurrentPushSubscription(),
      ])
      setEnabled(preference?.enabled ?? false)
      setReminderTime(preference?.reminder_time?.slice(0, 5) ?? DEFAULT_TIME)
      setDeviceCount(count)
      setCurrentDeviceRegistered(Boolean(subscription))
      setPermission(Notification.permission)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được cài đặt thông báo.')
    } finally {
      setLoading(false)
    }
  }, [active, supported, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const enable = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
      if (nextPermission !== 'granted') {
        throw new Error('Bạn chưa cho phép Ví Nhỏ gửi thông báo.')
      }
      await subscribeCurrentDevice()
      await saveNotificationPreference(userId, true, reminderTime)
      setEnabled(true)
      setCurrentDeviceRegistered(true)
      setDeviceCount((count) => Math.max(1, count))
      setMessage(`Đã bật nhắc nhở hằng ngày lúc ${reminderTime}.`)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không bật được thông báo.')
    } finally {
      setSaving(false)
    }
  }

  const disable = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await saveNotificationPreference(userId, false, reminderTime)
      setEnabled(false)
      setMessage('Đã tắt lời nhắc hằng ngày trên tất cả thiết bị.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tắt được thông báo.')
    } finally {
      setSaving(false)
    }
  }

  const updateTime = async (value: string) => {
    if (!/^\d{2}:\d{2}$/.test(value)) return
    setReminderTime(value)
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await saveNotificationPreference(userId, enabled, value)
      setMessage(`Đã đổi giờ nhắc thành ${value}.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được giờ nhắc.')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const sent = await sendTestNotification()
      setMessage(`Đã gửi thông báo thử tới ${sent} thiết bị.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không gửi được thông báo thử.')
    } finally {
      setSaving(false)
    }
  }

  return {
    configured: Boolean(vapidPublicKey),
    supported,
    enabled,
    reminderTime,
    deviceCount,
    currentDeviceRegistered,
    permission,
    loading,
    saving,
    message,
    error,
    enable,
    disable,
    updateTime,
    sendTest,
  }
}
