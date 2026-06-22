import React, { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Report } from '../types'
import { 
  Image, 
  MapPin, 
  Tag, 
  X, 
  AlertCircle,
  Sparkles,
  PhoneCall,
  Package,
  FileText
} from 'lucide-react'

interface CreateReportBoxProps {
  reportToEdit?: Report | null
  onReportCreated?: () => void
  onClose?: () => void // In case it's rendered inside a modal
}

export const CreateReportBox: React.FC<CreateReportBoxProps> = ({ 
  reportToEdit, 
  onReportCreated, 
  onClose 
}) => {
  const { profile } = useAuth()
  
  const [type, setType] = useState<'lost' | 'found'>('lost')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Elektronik',
    'Dokumen & Buku',
    'Kunci & Kartu',
    'Tas & Dompet',
    'Pakaian & Aksesoris',
    'Lainnya'
  ]

  // Pre-fill fields if we are editing
  useEffect(() => {
    if (reportToEdit) {
      setType(reportToEdit.type)
      setTitle(reportToEdit.title)
      setDescription(reportToEdit.description)
      setCategory(reportToEdit.category)
      setLocation(reportToEdit.location)
      setContactInfo(reportToEdit.contact_info)
      setExistingImageUrl(reportToEdit.image_url)
      setImagePreview(reportToEdit.image_url)
    } else {
      setType('lost')
      setTitle('')
      setDescription('')
      setCategory('')
      setLocation('')
      setContactInfo('')
      setExistingImageUrl(null)
      setImagePreview(null)
      setImageFile(null)
    }
  }, [reportToEdit])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar harus kurang dari 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setExistingImageUrl(null) // Overwrite existing image
      setError(null)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setExistingImageUrl(null)
    if (imagePreview) {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    if (!title.trim()) {
      setError('Silakan masukkan nama barang (judul).')
      return
    }
    if (!category) {
      setError('Silakan pilih kategori.')
      return
    }
    if (!location.trim()) {
      setError('Silakan masukkan lokasi barang hilang atau ditemukan.')
      return
    }
    if (!contactInfo.trim()) {
      setError('Silakan masukkan informasi kontak (misalnya nomor telepon, WhatsApp, atau email).')
      return
    }
    if (!description.trim()) {
      setError('Silakan deskripsikan barang tersebut.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      let finalImageUrl = existingImageUrl

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName)

        finalImageUrl = data.publicUrl
      }

      if (reportToEdit) {
        // Edit Mode
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            type,
            title: title.trim(),
            description: description.trim(),
            category,
            location: location.trim(),
            contact_info: contactInfo.trim(),
            image_url: finalImageUrl,
            status: profile.role === 'admin' ? reportToEdit.status : 'pending'
          })
          .eq('id', reportToEdit.id)

        if (updateError) throw updateError
      } else {
        // Create Mode
        const { error: insertError } = await supabase
          .from('reports')
          .insert({
            user_id: profile.id,
            type,
            title: title.trim(),
            description: description.trim(),
            category,
            location: location.trim(),
            contact_info: contactInfo.trim(),
            image_url: finalImageUrl,
            status: 'pending' // Default pending admin approval
          })

        if (insertError) throw insertError
      }

      setSuccess(true)
      
      if (!reportToEdit) {
        setTitle('')
        setDescription('')
        setCategory('')
        setLocation('')
        setContactInfo('')
        removeImage()
      }

      setTimeout(() => {
        setSuccess(false)
        if (onReportCreated) onReportCreated()
        if (onClose) onClose()
      }, 1500)

    } catch (err: any) {
      console.error('Error handling report:', err)
      setError(err.message || 'Terjadi kesalahan saat menyimpan laporan.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6 transition duration-200">
      
      {/* Type Selector Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-4 pb-2">
        <button
          type="button"
          onClick={() => setType('lost')}
          className={`flex-1 pb-2 font-bold text-center border-b-2 transition duration-200 cursor-pointer ${
            type === 'lost'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          Barang Hilang
        </button>
        <button
          type="button"
          onClick={() => setType('found')}
          className={`flex-1 pb-2 font-bold text-center border-b-2 transition duration-200 cursor-pointer ${
            type === 'found'
              ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          Barang Temuan
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200/50 dark:border-red-950/50">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm border border-emerald-200/50 dark:border-emerald-950/50">
          <Sparkles className="h-5 w-5 flex-shrink-0" />
          <span>
            {reportToEdit 
              ? 'Laporan berhasil diperbarui! Menunggu tinjauan jika status berubah.' 
              : 'Laporan berhasil dikirim! Menunggu persetujuan.'
            }
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4">
        {/* User avatar on the left */}
        <div className="hidden md:block">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || 'User')}`}
            alt={profile?.full_name}
            className="h-10 w-10 rounded-full border-2 border-primary object-cover"
          />
        </div>

        {/* Inputs on the right */}
        <div className="flex-1 flex flex-col gap-3">
          
          {/* Title input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Nama Barang / Judul Laporan
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 focus-within:border-primary/50 transition duration-150">
              <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Barang apa ini? (misal: Dompet Kulit, iPhone 14)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                className="w-full bg-transparent border-none text-sm font-semibold text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Form details in grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-left">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 focus-within:border-primary/50">
              <Tag className="h-4 w-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
                className="w-full bg-transparent border-none text-sm font-medium text-gray-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">{cat}</option>
                ))}
              </select>
            </div>

            {/* Location Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 focus-within:border-primary/50">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Detail lokasi (misal: Kantin, Perpustakaan)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={uploading}
                className="w-full bg-transparent border-none text-sm font-medium text-gray-700 dark:text-zinc-300 focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Contact Info Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 focus-within:border-primary/50 md:col-span-2">
              <PhoneCall className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Info Kontak (misal: WhatsApp 0812345678, email@domain.com)"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                disabled={uploading}
                className="w-full bg-transparent border-none text-sm font-medium text-gray-700 dark:text-zinc-300 focus:outline-none placeholder-gray-400"
              />
            </div>

          </div>

          {/* Description input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
              Deskripsi Barang
            </label>
            <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 focus-within:border-primary/50 transition duration-150">
              <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <textarea
                placeholder="Deskripsikan barang tersebut (warna, merek, nomor seri, tanggal hilang/ditemukan, konteks)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={3}
                className="w-full bg-transparent border-none text-sm leading-relaxed text-gray-800 dark:text-zinc-300 resize-none placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 max-h-72 w-full">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full h-full object-cover max-h-72"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition duration-150 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Footer of form */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-900">
            {/* Attachment Button */}
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 p-2 text-primary hover:bg-primary/10 rounded-full transition duration-150 cursor-pointer"
                title="Tambah Foto"
                disabled={uploading}
              >
                <Image className="h-5 w-5" />
                <span className="text-xs font-semibold hidden sm:inline">Tambah Foto</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-400 text-sm font-bold rounded-full hover:bg-gray-50 dark:hover:bg-zinc-900 transition duration-150 cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-full shadow-sm hover:shadow-md transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? 'Menyimpan...' : reportToEdit ? 'Simpan Perubahan' : 'Kirim Laporan'}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  )
}
