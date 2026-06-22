import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Report, ReportStats } from '../types'
import { 
  TrendingUp, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Search,
  Tag
} from 'lucide-react'

interface RightSidebarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [stats, setStats] = useState<ReportStats>({ totalLost: 0, totalFound: 0, totalPending: 0 })
  const [recentItems, setRecentItems] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const categories = [
    'Semua Kategori',
    'Elektronik',
    'Dokumen & Buku',
    'Kunci & Kartu',
    'Tas & Dompet',
    'Pakaian & Aksesoris',
    'Lainnya'
  ]

  const fetchRightSidebarData = async () => {
    try {
      // 1. Fetch Stats from reports table
      const [lostRes, foundRes, pendingRes] = await Promise.all([
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('type', 'lost'),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('type', 'found'),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ])

      setStats({
        totalLost: lostRes.count || 0,
        totalFound: foundRes.count || 0,
        totalPending: pendingRes.count || 0
      })

      // 2. Fetch Recent 3 Approved Items
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)

      if (!error && data) {
        setRecentItems(data as any[])
      }
    } catch (err) {
      console.error('Error fetching right sidebar data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRightSidebarData()

    // Subscribe to report changes
    const channel = supabase
      .channel('right_sidebar_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchRightSidebarData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-80 xl:w-96 h-screen sticky top-0 px-6 py-6 border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-black text-gray-900 dark:text-zinc-100 overflow-y-auto transition-colors duration-200">
      
      {/* Search Bar */}
      <div className="relative group flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition duration-200" />
        </div>
        <input
          type="text"
          placeholder="Cari barang, lokasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 border border-transparent rounded-full bg-gray-100 dark:bg-zinc-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:dark:bg-black focus:border-primary focus:ring-1 focus:ring-primary text-sm dark:text-zinc-100 transition duration-200"
        />
      </div>

      {/* Platform Stats Card */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/80 rounded-2xl flex-shrink-0">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Statistik Platform
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="text-xl font-extrabold text-red-500">{stats.totalLost}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Hilang</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="text-xl font-extrabold text-emerald-500">{stats.totalFound}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Temuan</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="text-xl font-extrabold text-primary">{stats.totalPending}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Antrean</div>
          </div>
        </div>
      </div>

      {/* Category Quick Selector */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/80 rounded-2xl flex-shrink-0">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Filter Kategori
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === (cat === 'Semua Kategori' ? '' : cat)
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'Semua Kategori' ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition duration-150 ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Approved Reports */}
      <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/80 rounded-2xl flex flex-col min-h-[220px] flex-shrink-0">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Aktivitas Terbaru
        </h3>
        {loading ? (
          <div className="flex items-center justify-center flex-grow py-8 text-gray-500 text-sm">
            Memuat aktivitas...
          </div>
        ) : recentItems.length === 0 ? (
          <div className="flex items-center justify-center flex-grow py-8 text-gray-500 text-sm text-center">
            Tidak ada laporan terbaru
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 flex flex-col gap-1 hover:border-primary/50 dark:hover:border-primary/50 transition duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    item.type === 'lost' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' 
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {item.type === 'lost' ? 'Hilang' : 'Temuan'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h4 className="font-bold text-sm line-clamp-1 text-gray-900 dark:text-zinc-100">{item.title}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip Card */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-left flex-shrink-0">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-primary">Menemukan barang Anda?</h4>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Jika Anda telah berhasil menemukan kembali barang Anda yang hilang atau mengembalikan barang temuan, Anda dapat mengedit atau menghapus laporan Anda secara langsung dari halaman profil!
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
