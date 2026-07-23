import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  recoveryMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  clearRecovery: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true
    let unsubscribe: (() => void) | undefined
    void getSupabaseClient()
      .then(async (client) => {
        if (!mounted) return
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, nextSession) => {
          if (!mounted) return
          setSession(nextSession)
          setLoading(false)
          if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
        })
        unsubscribe = () => subscription.unsubscribe()

        const { data, error } = await client.auth.getSession()
        if (error) throw error
        if (mounted) {
          setSession(data.session)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recoveryMode,
      signIn: async (email, password) => {
        const client = await getSupabaseClient()
        const { error } = await client.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signUp: async (email, password) => {
        const client = await getSupabaseClient()
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        return data.session === null
      },
      resetPassword: async (email) => {
        const client = await getSupabaseClient()
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
      },
      updatePassword: async (password) => {
        const client = await getSupabaseClient()
        const { error } = await client.auth.updateUser({ password })
        if (error) throw error
        setRecoveryMode(false)
      },
      clearRecovery: () => setRecoveryMode(false),
      signOut: async () => {
        if (!isSupabaseConfigured) return
        const client = await getSupabaseClient()
        const { error } = await client.auth.signOut()
        if (error) throw error
      },
    }),
    [loading, recoveryMode, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth phải nằm bên trong AuthProvider.')
  return value
}
