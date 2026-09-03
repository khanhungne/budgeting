import { createClient } from 'npm:@supabase/supabase-js@2.100.0'
// @deno-types="npm:@types/web-push@3.6.4"
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type PushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
}

type ClaimedReminder = {
  user_id: string
  delivery_date: string
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = requiredEnv('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = requiredEnv('VAPID_PRIVATE_KEY')
    const vapidSubject = requiredEnv('VAPID_SUBJECT')
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const body = (await request.json().catch(() => ({}))) as { mode?: string }
    const mode = body.mode === 'daily' ? 'daily' : body.mode === 'test' ? 'test' : null
    if (!mode) return jsonResponse({ ok: false, error: 'Invalid mode' }, 400)

    const sendToUser = async (
      userId: string,
      payload: Record<string, string>,
    ): Promise<{ sent: number; failed: number; error: string | null }> => {
      const { data, error } = await serviceClient
        .from('push_subscriptions')
        .select('id,endpoint,p256dh_key,auth_key')
        .eq('user_id', userId)
      if (error) throw error

      const subscriptions = (data ?? []) as PushSubscriptionRow[]
      let sent = 0
      let failed = 0
      const errors: string[] = []

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh_key,
                  auth: subscription.auth_key,
                },
              },
              JSON.stringify(payload),
              { TTL: 60 * 60 * 12, urgency: 'normal' },
            )
            sent += 1
          } catch (reason) {
            failed += 1
            const pushError = reason as { statusCode?: number; message?: string }
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
              await serviceClient.from('push_subscriptions').delete().eq('id', subscription.id)
            } else {
              errors.push(pushError.message || 'Unknown push service error')
            }
          }
        }),
      )

      return {
        sent,
        failed,
        error: errors.length > 0 ? errors.slice(0, 3).join('; ').slice(0, 1000) : null,
      }
    }

    if (mode === 'test') {
      const authorization = request.headers.get('Authorization')
      const accessToken = authorization?.replace(/^Bearer\s+/i, '')
      if (!accessToken) return jsonResponse({ ok: false, error: 'Authentication required' }, 401)

      const { data, error } = await serviceClient.auth.getUser(accessToken)
      if (error || !data.user) {
        return jsonResponse({ ok: false, error: 'Invalid session' }, 401)
      }

      const result = await sendToUser(data.user.id, {
        title: 'Ví Nhỏ đã sẵn sàng ✨',
        body: 'Thông báo đang hoạt động trên thiết bị của bạn.',
        url: '/?tab=transactions&new=1',
        tag: `test-${Date.now()}`,
      })
      return jsonResponse({ ok: result.sent > 0, ...result }, result.sent > 0 ? 200 : 502)
    }

    const cronSecret = requiredEnv('CRON_SECRET')
    if (request.headers.get('x-cron-secret') !== cronSecret) {
      return jsonResponse({ ok: false, error: 'Invalid cron secret' }, 401)
    }

    const { data: claimed, error: claimError } = await serviceClient.rpc(
      'claim_due_daily_reminders',
      { p_batch_size: 100 },
    )
    if (claimError) throw claimError

    let sent = 0
    let failed = 0
    for (const reminder of (claimed ?? []) as ClaimedReminder[]) {
      const result = await sendToUser(reminder.user_id, {
        title: 'Hãy thống kê lại hôm nay bạn đã chi tiêu như nào',
        body: 'Mở Ví Nhỏ để xem lại các khoản thu chi trong ngày nhé.',
        url: '/?tab=transactions&new=1',
        tag: `daily-reminder-${reminder.delivery_date}`,
      })
      sent += result.sent
      failed += result.failed

      const delivered = result.sent > 0
      const { error: updateError } = await serviceClient
        .from('notification_deliveries')
        .update({
          status: delivered ? 'sent' : 'failed',
          sent_at: delivered ? new Date().toISOString() : null,
          last_error: delivered ? null : result.error || 'No active push subscription',
        })
        .eq('user_id', reminder.user_id)
        .eq('delivery_date', reminder.delivery_date)
        .eq('kind', 'daily_reminder')
      if (updateError) throw updateError
    }

    return jsonResponse({
      ok: true,
      claimed: claimed?.length ?? 0,
      sent,
      failed,
    })
  } catch (reason) {
    console.error(reason)
    return jsonResponse(
      { ok: false, error: reason instanceof Error ? reason.message : 'Unexpected error' },
      500,
    )
  }
})
