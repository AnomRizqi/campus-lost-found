import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, KeyRound, Mail, AlertCircle } from 'lucide-react'

export const Login: React.FC = () => {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await signIn(email, password)
      if (res.success) {
        navigate('/')
      } else {
        setError(res.error || 'Email atau Kata Sandi salah')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan yang tidak terduga.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await signInWithGoogle()
      if (res.success) {
        navigate('/')
      } else {
        setError(res.error || 'Gagal masuk dengan Google')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat masuk dengan Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800/80 rounded-3xl p-8 shadow-xl text-left backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Selamat Datang Kembali!
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1.5 text-center">
            Masuk untuk mengakses Platform Barang Hilang & Temuan
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 mb-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200/50 dark:border-red-950/50">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                placeholder="email.anda@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:dark:bg-black focus:border-primary focus:ring-1 focus:ring-primary text-sm dark:text-zinc-100 transition duration-150"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:dark:bg-black focus:border-primary focus:ring-1 focus:ring-primary text-sm dark:text-zinc-100 transition duration-150"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-150 dark:border-zinc-900"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Atau</span>
          <div className="flex-grow border-t border-gray-150 dark:border-zinc-900"></div>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-200 font-bold rounded-xl shadow-sm transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Masuk dengan Google</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-900 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold transition">
              Daftar
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
