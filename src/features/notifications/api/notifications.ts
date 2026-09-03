import { getSupabaseClient } from '../../../lib/supabase'

export type NotificationPreference = {
  enabled: boolean
  reminder_time: string
  timezone: string
}

export const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? ''

const throwApiError = (error: { message?: string; details?: string; hint?: string }) => {
  const detail = [error.message, error.details, error.hint].filter(Boolean).join(' · ')
  throw new Error(detail || 'Supabase trả về lỗi không xác định.')
}

const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

export const detectPushPlatform = (): 'android' | 'ios' | 'desktop' | 'unknown' => {
  const userAgent = navigator.userAgent
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/windows|macintosh|linux/i.test(userAgent)) return 'desktop'
  return 'unknown'
}

export const getCurrentPushSubscription = async () => {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return registration?.pushManager.getSubscription() ?? null
}

export const subscribeCurrentDevice = async () => {
  if (!vapidPublicKey) throw new Error('Chưa cấu hình VAPID public key.')
  const registration = await navigator.serviceWorker.ready
  let existing = await registration.pushManager.getSubscription()
  const expectedKey = urlBase64ToUint8Array(vapidPublicKey)
  const existingKey = existing?.options.applicationServerKey
  if (
    existing &&
    existingKey &&
    !expectedKey.every((value, index) => value === new Uint8Array(existingKey)[index])
  ) {
    await existing.unsubscribe()
    existing = null
  }
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: expectedKey,
    }))
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error('Trình duyệt không trả về subscription hợp lệ.')
  }

  const client = await getSupabaseClient()
  const { error } = await client.rpc('register_push_subscription', {
    p_endpoint: serialized.endpoint,
    p_p256dh_key: serialized.keys.p256dh,
    p_auth_key: serialized.keys.auth,
    p_platform: detectPushPlatform(),
    p_user_agent: navigator.userAgent,
  })
  if (error) throwApiError(error)
  return subscription
}

export const loadNotificationPreference = async (userId: string) => {
  const client = await getSupabaseClient()
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    client
      .from('notification_preferences')
      .select('enabled,reminder_time,timezone')
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])
  if (error) throwApiError(error)
  if (countError) throwApiError(countError)
  return {
    preference: data as NotificationPreference | null,
    deviceCount: count ?? 0,
  }
}

export const saveNotificationPreference = async (
  userId: string,
  enabled: boolean,
  reminderTime: string,
) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
  const client = await getSupabaseClient()
  const { error } = await client.from('notification_preferences').upsert(
    {
      user_id: userId,
      enabled,
      reminder_time: reminderTime,
      timezone,
    },
    { onConflict: 'user_id' },
  )
  if (error) throwApiError(error)
}

export const sendTestNotification = async () => {
  const client = await getSupabaseClient()
  const { data, error } = await client.functions.invoke('send-notifications', {
    body: { mode: 'test' },
  })
  if (error) {
    let detail = error.message
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const payload = (await context.clone().json()) as { error?: string; message?: string }
        detail = payload.error || payload.message || detail
      } catch {
        // Keep the SDK error when the function did not return JSON.
      }
    }
    throw new Error(detail)
  }
  if (!data?.ok) throw new Error(data?.error || 'Không gửi được thông báo thử.')
  return Number(data.sent ?? 0)
}

export const detachCurrentPushSubscription = async () => {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return
  const client = await getSupabaseClient()
  let deleteError: Error | null = null
  try {
    const { error } = await client
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint)
    deleteError = error ? new Error(error.message) : null
  } finally {
    await subscription.unsubscribe()
  }
  if (deleteError) throw deleteError
}
