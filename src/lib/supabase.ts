import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    !supabasePublishableKey.includes('YOUR_KEY'),
)

let clientPromise: Promise<SupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return Promise.reject(new Error('Supabase chưa được cấu hình.'))
  }

  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  )

  return clientPromise
}
