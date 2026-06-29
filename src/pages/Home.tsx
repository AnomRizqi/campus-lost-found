import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { collection, query, orderBy, doc, getDoc, onSnapshot } from 'firebase/firestore'
import type { Report, Profile } from '../types'
import { Sidebar } from '../components/Sidebar'
import { RightSidebar } from '../components/RightSidebar'
import { CreateReportBox } from '../components/CreateReportBox'
import { EditReportModal } from '../components/EditReportModal'
import { ReportCard } from '../components/ReportCard'
import { 
  Sparkles, 
  Search, 
  Compass,
  AlertCircle
} from 'lucide-react'

export const Home: React.FC = () => {
  const { profile } = useAuth()
  
  // Lifting state for filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [feedType, setFeedType] = useState<'all' | 'lost' | 'found'>('all')
  
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit Report Modal state
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Report item modal state (triggered from left sidebar Report button)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const fetchReports = async () => {
    // Kept for compatibility with child components triggering refreshes.
    // The onSnapshot listener handles real-time updates automatically.
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const q = query(collection(db, 'reports'), orderBy('created_at', 'desc'))

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const reportsData: Report[] = []
        const profileCache: Record<string, Profile> = {}

        for (const reportDoc of querySnapshot.docs) {
          const data = reportDoc.data()
          const reportId = reportDoc.id
          const userId = data.user_id

          const isApproved = data.status === 'approved'
          const isOwner = profile && userId === profile.id
          const isAdmin = profile && profile.role === 'admin'

          if (isApproved || isOwner || isAdmin) {
            let creatorProfile: Profile | undefined = undefined
            if (userId) {
              if (profileCache[userId]) {
                creatorProfile = profileCache[userId]
              } else {
                const profileSnap = await getDoc(doc(db, 'profiles', userId))
                if (profileSnap.exists()) {
                  creatorProfile = profileSnap.data() as Profile
                  profileCache[userId] = creatorProfile
                }
              }
            }

            reportsData.push({
              id: reportId,
              user_id: userId,
              type: data.type,
              title: data.title,
              description: data.description,
              category: data.category,
              location: data.location,
              image_url: data.image_url || null,
              contact_info: data.contact_info,
              status: data.status,
              created_at: data.created_at,
              profiles: creatorProfile
            } as Report)
          }
        }

        setReports(reportsData)
        setLoading(false)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching/listening to Firestore reports:', err)
        setError('Tidak dapat memuat laporan. Silakan coba lagi.')
        setLoading(false)
      }
    }, (err) => {
      console.error('Firestore onSnapshot listener error:', err)
      setError('Gagal mendengarkan perubahan laporan secara real-time.')
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [profile?.id, profile?.role])

  const filteredReports = reports.filter((report) => {
    // Type filter
    if (feedType === 'lost' && report.type !== 'lost') return false
    if (feedType === 'found' && report.type !== 'found') return false

    // Category filter
    if (selectedCategory && report.category !== selectedCategory) return false

    // Search query filter (matches title, description, location, and name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = report.title.toLowerCase().includes(query)
      const matchesDesc = report.description.toLowerCase().includes(query)
      const matchesLoc = report.location.toLowerCase().includes(query)
      const matchesName = report.profiles?.full_name?.toLowerCase().includes(query) || false
      return matchesTitle || matchesDesc || matchesLoc || matchesName
    }

    return true
  })

  const handleEditClick = (report: Report) => {
    setReportToEdit(report)
    setIsEditModalOpen(true)
  }

  return (
    <div className="flex justify-center min-h-screen bg-white dark:bg-black text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="flex w-full max-w-7xl">
        
        {/* Left Sidebar Layout */}
        <Sidebar onCreatePostClick={() => setIsReportModalOpen(true)} />

        {/* Center Feed Layout */}
        <main className="flex-1 min-w-0 border-r border-gray-200 dark:border-zinc-800 pb-20 md:pb-6">
          
          {/* Sticky Header */}
          <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-30 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 py-3 md:py-4">
            <div className="flex items-center gap-3">
              {profile && (
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}`}
                  alt={profile.full_name}
                  className="h-8 w-8 rounded-full md:hidden object-cover border"
                />
              )}
              <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-gray-900 dark:text-zinc-100 m-0">
                Lost & Found Platform
              </h1>
            </div>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </header>

          {/* Inline Mobile Search Box (visible on mobile screens) */}
          <div className="lg:hidden p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari barang, lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 border border-transparent rounded-full text-xs placeholder-gray-500 focus:outline-none focus:bg-white focus:dark:bg-black focus:border-primary focus:ring-1 focus:ring-primary dark:text-zinc-100 transition"
              />
            </div>
            {/* Inline Category Select for Mobile */}
            <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
              {['Semua Kategori', 'Elektronik', 'Dokumen & Buku', 'Kunci & Kartu', 'Tas & Dompet', 'Pakaian & Aksesoris', 'Lainnya'].map((cat) => {
                const isSelected = selectedCategory === (cat === 'Semua Kategori' ? '' : cat)
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Semua Kategori' ? '' : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Inline Create Report Box (desktop) */}
          {profile && profile.role !== 'admin' && (
            <div className="hidden md:block p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
              <CreateReportBox onReportCreated={fetchReports} />
            </div>
          )}

          {/* Feed Filter Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-800 text-sm font-bold bg-white dark:bg-black">
            <button
              onClick={() => setFeedType('all')}
              className={`flex-1 py-3 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer ${
                feedType === 'all'
                  ? 'border-primary text-gray-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              Semua Laporan
            </button>
            <button
              onClick={() => setFeedType('lost')}
              className={`flex-1 py-3 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer ${
                feedType === 'lost'
                  ? 'border-red-500 text-red-500 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              Hilang
            </button>
            <button
              onClick={() => setFeedType('found')}
              className={`flex-1 py-3 text-center border-b-2 hover:bg-gray-50 dark:hover:bg-zinc-950 transition duration-150 cursor-pointer ${
                feedType === 'found'
                  ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-zinc-500'
              }`}
            >
              Temuan
            </button>
          </div>

          {/* Feed Reports List */}
          <div className="flex flex-col p-4 gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500 dark:text-zinc-500 font-semibold">Memuat beranda...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/50 p-6 rounded-2xl">
                <AlertCircle className="h-10 w-10 mb-2" />
                <h4 className="font-bold text-lg">Gagal memuat laporan</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{error}</p>
                <button
                  onClick={fetchReports}
                  className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  Ulangi
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center text-gray-500">
                <Compass className="h-16 w-16 text-gray-300 dark:text-zinc-800 mb-4 stroke-[1.25px]" />
                <h3 className="font-extrabold text-lg text-gray-800 dark:text-zinc-300">Laporan tidak ditemukan</h3>
                <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-sm mt-1">
                  Kami tidak dapat menemukan laporan yang disetujui yang cocok dengan kriteria Anda. Jadilah yang pertama melaporkan sesuatu!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onRefresh={fetchReports}
                    onEditClick={handleEditClick}
                  />
                ))}
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

        {/* Edit Report Modal */}
        <EditReportModal
          report={reportToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setReportToEdit(null)
          }}
          onReportUpdated={fetchReports}
        />

        {/* Floating Modal for Report Item */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div 
              className="w-full max-w-xl bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-3xl p-1 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-gray-50 dark:bg-zinc-950/80">
                <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Laporkan Barang Baru
                </h3>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
                </button>
              </div>
              <div className="p-4">
                <CreateReportBox 
                  onReportCreated={() => {
                    fetchReports()
                    setIsReportModalOpen(false)
                  }}
                  onClose={() => setIsReportModalOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const X = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className={className} 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
