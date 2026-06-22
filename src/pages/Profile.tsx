import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Profile as ProfileType, Report } from '../types'
import { Sidebar } from '../components/Sidebar'
import { RightSidebar } from '../components/RightSidebar'
import { ReportCard } from '../components/ReportCard'
import { EditReportModal } from '../components/EditReportModal'
import { 
  Calendar, 
  Mail, 
  ArrowLeft,
  Compass,
  AlertCircle
} from 'lucide-react'

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { profile: currentUserProfile } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingReports, setLoadingReports] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit Report Modal state
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Lifting dummy states for right sidebar
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const isOwnProfile = currentUserProfile?.id === id

  const fetchProfileData = async () => {
    if (!id) return
    setLoadingProfile(true)
    setError(null)
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData as ProfileType)

      // 2. Fetch User's Reports
      // If viewing own profile or if current user is admin, fetch all statuses. Otherwise, fetch only approved.
      const isAdmin = currentUserProfile?.role === 'admin'
      let reportQuery = supabase
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
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      if (!isOwnProfile && !isAdmin) {
        reportQuery = reportQuery.eq('status', 'approved')
      }

      const { data: reportData, error: reportError } = await reportQuery
      if (reportError) throw reportError
      setReports(reportData as Report[])

    } catch (err: any) {
      console.error('Error fetching profile data:', err)
      setError('Could not load profile details.')
    } finally {
      setLoadingProfile(false)
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [id, currentUserProfile])

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-black text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="flex w-full max-w-7xl">
        
        {/* Left Sidebar */}
        <Sidebar onCreatePostClick={() => navigate('/')} />

        {/* Center Section */}
        <main className="flex-1 min-w-0 border-r border-gray-200 dark:border-zinc-800 pb-20 md:pb-6">
          {/* Header */}
          <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-30 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-6 px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 rounded-full transition cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-left">
              <h1 className="font-extrabold text-lg md:text-xl text-gray-900 dark:text-zinc-100 m-0">
                {loadingProfile ? 'Memuat...' : profile?.full_name}
              </h1>
              <span className="text-xs text-gray-500 dark:text-zinc-500">
                {reports.length} laporan
              </span>
            </div>
          </header>

          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 dark:text-zinc-500">Memuat detail profil...</span>
            </div>
          ) : error || !profile ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/50 m-6 p-6 rounded-2xl">
              <AlertCircle className="h-10 w-10 mb-2" />
              <h4 className="font-bold text-lg">Profil tidak ditemukan</h4>
              <p className="text-xs text-gray-500 mt-1">{error || 'Profil pengguna mungkin telah dihapus.'}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              
              {/* Cover Banner Gradient */}
              <div className="h-32 md:h-44 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 relative"></div>

              {/* Profile Info Box */}
              <div className="px-4 md:px-6 pb-6 relative text-left">
                {/* Avatar Overlay */}
                <div className="absolute -top-16 left-4 md:left-6">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}`}
                    alt={profile.full_name}
                    className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white dark:border-black bg-white dark:bg-zinc-950 object-cover shadow-md"
                  />
                </div>

                {/* Info and Metadata Grid */}
                <div className="pt-12 md:pt-18 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      {profile.full_name}
                      {profile.role === 'admin' && (
                        <span className="flex items-center gap-0.5 px-2.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] uppercase font-bold rounded-full">
                          Admin
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-500 font-semibold mt-0.5">
                      {profile.role === 'admin' ? 'Administrator Platform' : 'Pengguna Platform'}
                    </p>
                  </div>
                </div>

                {/* Metadata details list */}
                <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-gray-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Bergabung {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              </div>

              {/* Profile Tabs (Only reports count) */}
              <div className="flex border-b border-gray-200 dark:border-zinc-800 text-sm font-bold bg-white dark:bg-black">
                <button
                  className="flex-1 py-3 text-center border-b-2 border-primary text-gray-900 dark:text-zinc-100"
                >
                  Laporan ({reports.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4 flex flex-col gap-4">
                {loadingReports ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                    <Compass className="h-12 w-12 mb-2 stroke-[1.5px]" />
                    <p className="font-semibold text-sm">Belum ada laporan</p>
                    <p className="text-xs mt-1">Laporan barang yang dibuat oleh pengguna ini akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reports.map((report) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        onRefresh={fetchProfileData}
                        onEditClick={(r) => {
                          setReportToEdit(r)
                          setIsEditModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Edit Report Modal */}
        <EditReportModal
          report={reportToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setReportToEdit(null)
          }}
          onReportUpdated={fetchProfileData}
        />

      </div>
    </div>
  )
}

