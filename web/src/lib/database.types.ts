/**
 * Hand-maintained mirror of supabase/migrations. Keep in sync when the schema changes.
 */
export type UserRole = 'admin' | 'tenant'
export type RequestCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other'
export type RequestPriority = 'low' | 'normal' | 'urgent'
export type RequestStatus = 'new' | 'in_progress' | 'done' | 'cancelled'
export type FeeStatus = 'unpaid' | 'paid'

export const REQUEST_CATEGORIES: RequestCategory[] = [
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'structural',
  'other',
]
export const REQUEST_PRIORITIES: RequestPriority[] = ['low', 'normal', 'urgent']
export const REQUEST_STATUSES: RequestStatus[] = ['new', 'in_progress', 'done', 'cancelled']

export type Apartment = {
  id: string
  unit_number: string
  floor: number | null
  notes: string | null
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  apartment_id: string | null
  preferred_lang: 'en' | 'ar'
  is_active: boolean
  is_demo: boolean
  email: string | null
  created_at: string
}

export type MaintenanceRequest = {
  id: string
  apartment_id: string
  created_by: string
  title: string
  description: string
  category: RequestCategory
  priority: RequestPriority
  status: RequestStatus
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type RequestAdminNote = {
  request_id: string
  body: string
  updated_by: string | null
  updated_at: string
}

export type RequestPhoto = {
  id: string
  request_id: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export type RequestComment = {
  id: string
  request_id: string
  author_id: string
  body: string
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  body: string
  pinned: boolean
  published_at: string
  created_by: string
  created_at: string
}

export type Fee = {
  id: string
  apartment_id: string
  title: string
  amount: number
  due_date: string
  status: FeeStatus
  paid_at: string | null
  note: string | null
  created_at: string
}

export type AdminDashboardStats = {
  new_count: number
  in_progress_count: number
  done_count: number
  urgent_open_count: number
  unpaid_total: number
  unpaid_count: number
  tenants_count: number
  apartments_count: number
}

/** Mirrors the shape produced by `supabase gen types typescript`. */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      apartments: {
        Row: Apartment
        Insert: {
          id?: string
          unit_number: string
          floor?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          unit_number?: string
          floor?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role?: UserRole
          apartment_id?: string | null
          preferred_lang?: 'en' | 'ar'
          is_active?: boolean
          is_demo?: boolean
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          role?: UserRole
          apartment_id?: string | null
          preferred_lang?: 'en' | 'ar'
          is_active?: boolean
          is_demo?: boolean
          email?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_apartment_id_fkey'
            columns: ['apartment_id']
            isOneToOne: false
            referencedRelation: 'apartments'
            referencedColumns: ['id']
          },
        ]
      }
      maintenance_requests: {
        Row: MaintenanceRequest
        Insert: {
          id?: string
          apartment_id: string
          created_by: string
          title: string
          description: string
          category: RequestCategory
          priority?: RequestPriority
          status?: RequestStatus
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          created_by?: string
          title?: string
          description?: string
          category?: RequestCategory
          priority?: RequestPriority
          status?: RequestStatus
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_requests_apartment_id_fkey'
            columns: ['apartment_id']
            isOneToOne: false
            referencedRelation: 'apartments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'maintenance_requests_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      request_admin_notes: {
        Row: RequestAdminNote
        Insert: {
          request_id: string
          body?: string
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          request_id?: string
          body?: string
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_admin_notes_request_id_fkey'
            columns: ['request_id']
            isOneToOne: true
            referencedRelation: 'maintenance_requests'
            referencedColumns: ['id']
          },
        ]
      }
      request_photos: {
        Row: RequestPhoto
        Insert: {
          id?: string
          request_id: string
          storage_path: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          storage_path?: string
          uploaded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_photos_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'maintenance_requests'
            referencedColumns: ['id']
          },
        ]
      }
      request_comments: {
        Row: RequestComment
        Insert: {
          id?: string
          request_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_comments_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'maintenance_requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      announcements: {
        Row: Announcement
        Insert: {
          id?: string
          title: string
          body: string
          pinned?: boolean
          published_at?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          pinned?: boolean
          published_at?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      fees: {
        Row: Fee
        Insert: {
          id?: string
          apartment_id: string
          title: string
          amount: number
          due_date: string
          status?: FeeStatus
          paid_at?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          title?: string
          amount?: number
          due_date?: string
          status?: FeeStatus
          paid_at?: string | null
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fees_apartment_id_fkey'
            columns: ['apartment_id']
            isOneToOne: false
            referencedRelation: 'apartments'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_apartment_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: AdminDashboardStats[]
      }
    }
    Enums: {
      user_role: UserRole
      request_category: RequestCategory
      request_priority: RequestPriority
      request_status: RequestStatus
      fee_status: FeeStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
