import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, googleProvider } from '../lib/firebase'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  signInWithPopup
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { Profile } from '../types'

interface AuthContextType {
  user: FirebaseUser | null
  session: FirebaseUser | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role?: 'user' | 'admin') => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [session, setSession] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'profiles', userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setProfile({
          id: docSnap.id,
          full_name: data.full_name || 'User Baru',
          email: data.email || '',
          role: data.role || 'user',
          created_at: data.created_at || new Date().toISOString()
        } as Profile)
      } else {
        // Fallback: If user is authenticated but Firestore profile doesn't exist, try to recreate it
        const currentUser = auth.currentUser
        if (currentUser) {
          const newProfile: Profile = {
            id: currentUser.uid,
            full_name: currentUser.displayName || 'User Baru',
            email: currentUser.email || '',
            role: 'user',
            created_at: new Date().toISOString()
          }
          await setDoc(docRef, newProfile)
          setProfile(newProfile)
          return
        }
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid)
    }
  }

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setSession(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Keep loading false after profile fetches or if there's no user
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const currentUser = userCredential.user

      // Create profile document in Firestore
      const newProfile: Profile = {
        id: currentUser.uid,
        full_name: fullName,
        email: email,
        role: role,
        created_at: new Date().toISOString()
      }
      await setDoc(doc(db, 'profiles', currentUser.uid), newProfile)
      setProfile(newProfile)

      return { success: true }
    } catch (err: any) {
      console.error('Error during sign up:', err)
      let errorMessage = 'Terjadi kesalahan saat mendaftar.'
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Alamat email sudah digunakan oleh akun lain.'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Kata sandi terlalu lemah (minimal 6 karakter).'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Alamat email tidak valid.'
      }
      return {
        success: false,
        error: err.message || errorMessage,
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (err: any) {
      console.error('Error during sign in:', err)
      let errorMessage = 'Email atau kata sandi salah.'
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau kata sandi salah.'
      }
      return {
        success: false,
        error: err.message || errorMessage,
      }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const currentUser = result.user

      // Check if user profile already exists
      const docRef = doc(db, 'profiles', currentUser.uid)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        const newProfile: Profile = {
          id: currentUser.uid,
          full_name: currentUser.displayName || 'Google User',
          email: currentUser.email || '',
          role: 'user',
          created_at: new Date().toISOString()
        }
        await setDoc(docRef, newProfile)
        setProfile(newProfile)
      } else {
        const data = docSnap.data()
        setProfile({
          id: docSnap.id,
          full_name: data.full_name || 'Google User',
          email: data.email || '',
          role: data.role || 'user',
          created_at: data.created_at || new Date().toISOString()
        } as Profile)
      }

      return { success: true }
    } catch (err: any) {
      console.error('Error Google sign in:', err)
      return {
        success: false,
        error: err.message || 'Terjadi kesalahan saat masuk dengan Google.',
      }
    }
  }

  const signOut = async () => {
    setLoading(true)
    await firebaseSignOut(auth)
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
        signInWithGoogle,
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

