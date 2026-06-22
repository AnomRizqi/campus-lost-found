export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export type ReportType = 'lost' | 'found'
export type ReportStatus = 'pending' | 'approved' | 'rejected'

export interface Report {
  id: string
  user_id: string
  type: ReportType
  title: string
  description: string
  category: string
  location: string
  image_url: string | null
  contact_info: string
  status: ReportStatus
  created_at: string
  profiles?: Profile // Joined profile of creator
}

export interface ReportStats {
  totalLost: number
  totalFound: number
  totalPending: number
}
