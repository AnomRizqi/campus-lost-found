import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Profile, Report } from '../types'
import { Sidebar } from '../components/Sidebar'
import { RightSidebar } from '../components/RightSidebar'
import { ReportCard } from '../components/ReportCard'
import { 
  ShieldCheck, 
  Users, 
  Inbox, 
  Trash2, 
  Search, 
  UserMinus, 
  UserCheck, 
  AlertTriangle,
  ShieldAlert
} from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const { profile: currentUserProfile } = useAuth()
  const navigate = useNavigate()

  // Guard: Redirect non-admins
  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== 'admin') {
      navigate('/')
    }
  }, [currentUserProfile, navigate])

  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'users'>('pending')
  
  const [pendingReports, setPendingReports] = useState<Report[]>([])
  const [allReports, setAllReports] = useState<Report[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [searchReportQuery, setSearchReportQuery] = useState('')

  // Dummy states for right sidebar
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch pending reports
      const { data: pendingData, error: pendingError } = await supabase
        .from('reports')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingError) throw pendingError
      setPendingReports(pendingData as Report[])

      // 2. Fetch all reports
      const { data: allData, error: allReportError } = await supabase
        .from('reports')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (allReportError) throw allReportError
      setAllReports(allData as Report[])

      // 3. Fetch all user profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (userError) throw userError
      setUsers(userData as Profile[])

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchData()
    }
  }, [currentUserProfile])

  const handleToggleUserRole = async (targetUser: Profile) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`Apakah Anda yakin ingin mengubah peran ${targetUser.full_name} menjadi ${newRole === 'admin' ? 'Admin' : 'Pengguna'}?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUser.id)

      if (error) throw error
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u))
    } catch (err) {
      console.error('Error toggling user role:', err)
      alert('Gagal mengubah peran pengguna.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('PERINGATAN: Menghapus profil ini akan menghapus semua data akun mereka. Apakah Anda yakin?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      setUsers(users.filter(u => u.id !== userId))
      fetchData() // Refresh reports
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Gagal menghapus profil pengguna.')
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchUserQuery.trim()) return true
    const query = searchUserQuery.toLowerCase()
    return (
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  })

  const filteredAllReports = allReports.filter((r) => {
    if (!searchReportQuery.trim()) return true
    const query = searchReportQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query)
    )
  })

  if (currentUserProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 text-center">
        <div className="max-w-md bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-red-100 dark:border-red-950/40">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
            Anda tidak memiliki hak akses administratif untuk mengakses panel ini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-black text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="flex w-full max-w-7xl">
        
        {/* Left Navigation */}
        <Sidebar onCreatePostClick={() => navigate('/')} />

        {/* Center Content */}
        <main className="flex-1 min-w-0 border-r border-gray-200 dark:border-zinc-800 pb-20 md:pb-6">
          {/* Header */}
          <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-30 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 py-3 md:py-4">
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2 m-0">
              <ShieldCheck className="h-6 w-6 text-red-500" />
              Panel Kontrol Admin
            </h1>
          </header>

          {/* Admin Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-800 text-sm font-bold bg-white dark:bg-black">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3.5 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'border-primary text-gray-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              <Inbox className="h-4.5 w-4.5" />
              <span>Tinjauan Tertunda ({pendingReports.length})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3.5 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'border-primary text-gray-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>Semua Laporan ({allReports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3.5 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'users'
                  ? 'border-primary text-gray-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Pengguna ({users.length})</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="p-4 flex flex-col gap-4">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500 font-semibold">Memuat Data Panel Admin...</span>
              </div>
            ) : activeTab === 'pending' ? (
              // PENDING REVIEWS
              pendingReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-gray-500">
                  <ShieldCheck className="h-14 w-14 text-emerald-500 mb-4 stroke-[1.5px] animate-bounce" />
                  <h3 className="font-extrabold text-lg text-gray-800 dark:text-zinc-300">Kotak Masuk Bersih!</h3>
                  <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-xs mt-1">
                    Saat ini tidak ada laporan Barang Hilang atau Temuan yang menunggu persetujuan.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pendingReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onRefresh={fetchData}
                    />
                  ))}
                </div>
              )
            ) : activeTab === 'all' ? (
              // ALL REPORTS MODERATION
              <div className="flex flex-col gap-4">
                {/* Search input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari laporan untuk ditinjau/dihapus..."
                    value={searchReportQuery}
                    onChange={(e) => setSearchReportQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-zinc-100"
                  />
                </div>

                {filteredAllReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Tidak ada laporan yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredAllReports.map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        onRefresh={fetchData}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // USERS DIRECTORY MANAGEMENT
              <div className="flex flex-col gap-4">
                {/* Search box */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari pengguna berdasarkan nama atau email..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-zinc-100"
                  />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-black">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-xs font-bold uppercase text-gray-500 tracking-wider">
                        <th className="p-4">Pengguna</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Peran</th>
                        <th className="p-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-900 text-sm font-semibold">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/10">
                          {/* User Column */}
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name)}`}
                              alt={u.full_name}
                              className="h-8 w-8 rounded-full object-cover border"
                            />
                            <span className="font-bold text-gray-900 dark:text-zinc-100 truncate max-w-[150px]">
                              {u.full_name}
                            </span>
                          </td>
                          {/* Email Column */}
                          <td className="p-4 text-gray-600 dark:text-zinc-400 truncate max-w-[200px]">
                            {u.email}
                          </td>
                          {/* Role Badge */}
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </td>
                          {/* Admin Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle Role (User <-> Admin) */}
                              <button
                                onClick={() => handleToggleUserRole(u)}
                                disabled={u.id === currentUserProfile.id}
                                className={`p-1.5 rounded-lg border transition duration-150 cursor-pointer ${
                                  u.role === 'admin'
                                    ? 'border-gray-200 dark:border-zinc-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    : 'border-red-200 dark:border-red-950 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                title={u.role === 'admin' ? 'Cabut Peran Admin' : 'Promosikan Jadi Admin'}
                              >
                                {u.role === 'admin' ? (
                                  <UserMinus className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === currentUserProfile.id}
                                className="p-1.5 border border-transparent text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      Pengguna tidak ditemukan.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar Layout */}
        <RightSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

      </div>
    </div>
  )
}

