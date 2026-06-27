import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type User, type Session } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role?: 'user' | 'admin') => Promise<{ success: boolean; requiresVerification: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Fallback: If profile table exists but trigger is slow/missing, try creating it from metadata
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const metadata = user.user_metadata
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: metadata.full_name || 'Anonymous User',
              email: user.email || '',
              role: metadata.role || 'user',
            })
            .select()
            .single()

          if (!insertError) {
            setProfile(newProfile)
            return
          }
        }
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Keep loading false after initial profile load
  useEffect(() => {
    if (user && profile) {
      setLoading(false)
    } else if (!user) {
      setLoading(false)
    }
  }, [user, profile])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'user' | 'admin' = 'user'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })

      if (error) throw error

      // If user session is returned immediately, email verification is disabled in Supabase dashboard
      const hasSession = !!data.session
      return {
        success: true,
        requiresVerification: !hasSession,
      }
    } catch (err: any) {
      return {
        success: false,
        requiresVerification: false,
        error: err.message || 'An error occurred during sign up.',
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An error occurred during sign in.',
      }
    }
  }

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Invalid or expired verification code.',
      }
    }
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
