import React from 'react'
import { CreateReportBox } from './CreateReportBox'
import type { Report } from '../types'
import { X, Sparkles } from 'lucide-react'

interface EditReportModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onReportUpdated: () => void
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onReportUpdated,
}) => {
  if (!isOpen || !report) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-3xl p-1 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-gray-50 dark:bg-zinc-950/80">
          <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Edit Detail Laporan
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          <CreateReportBox 
            reportToEdit={report}
            onReportCreated={onReportUpdated}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
