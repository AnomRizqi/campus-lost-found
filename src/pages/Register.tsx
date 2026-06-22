import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, User, Mail, AlertCircle, KeyRound } from 'lucide-react'

export const Register: React.FC = () => {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Quick validations
    if (!fullName.trim()) {
      setError('Nama Lengkap wajib diisi.')
      setLoading(false)
      return
    }
    if (!email.trim()) {
      setError('Email wajib diisi.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Kata Sandi minimal 6 karakter.')
      setLoading(false)
      return
    }

    try {
      const res = await signUp(email, password, fullName, 'user')
      
      if (res.success) {
        // Coba login otomatis setelah pendaftaran sukses
        const loginRes = await signIn(email, password)
        if (loginRes.success) {
          navigate('/')
        } else {
          // Jika gagal login otomatis (misal karena verifikasi email Supabase masih aktif atau konfigurasi lain),
          // arahkan ke halaman masuk agar pengguna bisa mencoba masuk secara manual.
          navigate('/login')
        }
      } else {
        setError(res.error || 'Pendaftaran gagal.')
      }
    } catch (err: any) {
      console.error(err)
      setError('Terjadi kesalahan yang tidak terduga.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800/80 rounded-3xl p-8 shadow-xl text-left backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Buat Akun Baru
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1.5">
            Daftar untuk melaporkan atau menemukan barang hilang
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 mb-5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200/50 dark:border-red-950/50">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full name input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                placeholder="Nama Lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:dark:bg-black focus:border-primary focus:ring-1 focus:ring-primary text-sm dark:text-zinc-100 transition duration-150"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-gray-400" />
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Kata Sandi (min. 6 karakter)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4.5 w-4.5 text-gray-400" />
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
            className="w-full mt-3 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Membuat akun...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-900 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold transition">
              Masuk
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
