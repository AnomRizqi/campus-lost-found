import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import type { Report } from '../types'
import { 
  MapPin, 
  Tag, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  PhoneCall,
  Edit2
} from 'lucide-react'

interface ReportCardProps {
  report: Report
  onRefresh?: () => void
  onEditClick?: (report: Report) => void
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onRefresh, onEditClick }) => {
  const { profile } = useAuth()
  
  const [moderating, setModerating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    if (!profile || profile.role !== 'admin') return
    setModerating(true)
    try {
      const reportRef = doc(db, 'reports', report.id)
      await updateDoc(reportRef, { status: newStatus })

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Gagal memperbarui status')
    } finally {
      setModerating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return
    setDeleting(true)
    try {
      const reportRef = doc(db, 'reports', report.id)
      await deleteDoc(reportRef)

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error deleting report:', err)
      alert('Gagal menghapus laporan')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMins < 60) {
      return `${diffMins || 1} mnt`
    } else if (diffHours < 24) {
      return `${diffHours} jam`
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const reporter = report.profiles
  const isOwner = profile?.id === report.user_id
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 p-4 md:p-5 rounded-2xl hover:bg-gray-50/50 dark:hover:bg-zinc-900/10 transition duration-200 text-left">
      
      {/* Banner status info for pending/rejected */}
      {(isOwner || isAdmin) && report.status !== 'approved' && (
        <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-semibold mb-4 border ${
          report.status === 'pending'
            ? 'bg-amber-50/80 text-amber-800 border-amber-200/50 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-950/40'
            : 'bg-red-50/80 text-red-800 border-red-200/50 dark:bg-red-950/10 dark:text-red-400 dark:border-red-950/40'
        }`}>
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold uppercase tracking-wider text-[10px] mb-1">
              {report.status === 'pending' ? 'Menunggu Persetujuan Admin' : 'Laporan Ditolak'}
            </div>
            <p className="leading-relaxed text-gray-700 dark:text-zinc-300">
              {report.status === 'pending' 
                ? 'Laporan dan foto Anda sedang menunggu persetujuan admin sebelum dipublikasikan ke publik. Saat ini, hanya Anda dan admin yang dapat melihat laporan ini di beranda.' 
                : 'Laporan ini ditolak oleh admin dan tidak akan ditampilkan untuk publik.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {/* User avatar derived from initials */}
        <Link to={`/profile/${report.user_id}`} className="flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reporter?.full_name || 'User')}`}
            alt={reporter?.full_name || 'User'}
            className="h-10 w-10 rounded-full object-cover border border-gray-100 dark:border-zinc-800"
          />
        </Link>

        {/* Content detail */}
        <div className="flex-1 min-w-0">
          
          {/* Header metadata */}
          <div className="flex items-center justify-between flex-wrap gap-x-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link 
                to={`/profile/${report.user_id}`} 
                className="font-bold text-gray-900 dark:text-zinc-100 hover:underline truncate text-sm md:text-base"
              >
                {reporter?.full_name || 'Pengguna Anonim'}
              </Link>
              <span className="text-gray-400 dark:text-zinc-600 text-xs select-none">·</span>
              <span className="text-gray-500 dark:text-zinc-500 text-xs">
                {formatDate(report.created_at)}
              </span>
            </div>

            {/* Type Badge */}
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none ${
              report.type === 'lost'
                ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              {report.type === 'lost' ? 'Hilang' : 'Temuan'}
            </span>
          </div>

          {/* Item details tags */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-gray-500 dark:text-zinc-500">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-gray-100/50 dark:border-zinc-800">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>{report.category}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-gray-100/50 dark:border-zinc-800">
              <MapPin className="h-3.5 w-3.5 text-red-500" />
              <span>{report.location}</span>
            </div>
          </div>

          {/* Title and Description */}
          <div className="mt-3">
            <h3 className="font-extrabold text-base md:text-lg text-gray-900 dark:text-zinc-100 leading-snug">
              {report.title}
            </h3>
            <p className="text-gray-800 dark:text-zinc-300 text-sm md:text-base leading-relaxed mt-1.5 whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* Attached image */}
          {report.image_url && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 max-h-96 bg-gray-50 dark:bg-zinc-950/50">
              <img
                src={report.image_url}
                alt={report.title}
                className="w-full h-full object-cover max-h-96"
                loading="lazy"
              />
            </div>
          )}

          {/* Contact Information display panel */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-900 rounded-xl flex items-center gap-3">
            <PhoneCall className="h-4.5 w-4.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Info Kontak</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">{report.contact_info}</div>
            </div>
          </div>

          {/* Action Footer (Moderate, Edit, Delete) */}
          {(isOwner || isAdmin) && (
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-zinc-900/80">
              
              {/* Edit Report Trigger (Owner) */}
              {isOwner && onEditClick && (
                <button
                  onClick={() => onEditClick(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-full transition cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {/* Admin Approval triggers */}
              {isAdmin && report.status === 'pending' && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={moderating}
                    className="flex items-center justify-center p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-400 rounded-full transition duration-150 cursor-pointer"
                    title="Setujui Laporan"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={moderating}
                    className="flex items-center justify-center p-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 rounded-full transition duration-150 cursor-pointer"
                    title="Tolak Laporan"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Delete action */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition duration-150 cursor-pointer"
                title="Hapus Laporan"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
