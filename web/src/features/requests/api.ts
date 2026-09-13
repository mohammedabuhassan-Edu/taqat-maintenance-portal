import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PHOTO_BUCKET, supabase } from '@/lib/supabase'
import type {
  MaintenanceRequest,
  RequestCategory,
  RequestComment,
  RequestPhoto,
  RequestPriority,
  RequestStatus,
} from '@/lib/database.types'

export const MAX_PHOTOS = 5
export const MAX_PHOTO_MB = 5
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const requestKeys = {
  all: ['requests'] as const,
  list: (filters: RequestFilters) => ['requests', 'list', filters] as const,
  detail: (id: string) => ['requests', id] as const,
  comments: (id: string) => ['requests', id, 'comments'] as const,
  photos: (id: string) => ['requests', id, 'photos'] as const,
}

export interface RequestFilters {
  status?: RequestStatus | 'open' | ''
  category?: RequestCategory | ''
  priority?: RequestPriority | ''
  apartment_id?: string
  search?: string
  limit?: number
}

export type RequestRow = MaintenanceRequest & {
  apartments: { unit_number: string } | null
  creator: { full_name: string } | null
}

const REQUEST_SELECT = '*, apartments(unit_number), creator:profiles!maintenance_requests_created_by_fkey(full_name)'

export function useRequests(filters: RequestFilters = {}) {
  return useQuery({
    queryKey: requestKeys.list(filters),
    queryFn: async (): Promise<RequestRow[]> => {
      let q = supabase.from('maintenance_requests').select(REQUEST_SELECT).order('created_at', { ascending: false })
      if (filters.status === 'open') q = q.in('status', ['new', 'in_progress'])
      else if (filters.status) q = q.eq('status', filters.status)
      if (filters.category) q = q.eq('category', filters.category)
      if (filters.priority) q = q.eq('priority', filters.priority)
      if (filters.apartment_id) q = q.eq('apartment_id', filters.apartment_id)
      if (filters.search?.trim()) {
        const s = filters.search.trim().replace(/[%,()]/g, ' ')
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`)
      }
      if (filters.limit) q = q.limit(filters.limit)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as RequestRow[]
    },
  })
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: requestKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<RequestRow> => {
      const { data, error } = await supabase.from('maintenance_requests').select(REQUEST_SELECT).eq('id', id!).single()
      if (error) throw error
      return data as unknown as RequestRow
    },
  })
}

export interface NewRequestInput {
  apartment_id: string
  created_by: string
  title: string
  description: string
  category: RequestCategory
  priority: RequestPriority
  photos: File[]
}

export interface CreateRequestResult {
  request: MaintenanceRequest
  failedPhotos: number
}

export function useCreateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ photos, ...input }: NewRequestInput): Promise<CreateRequestResult> => {
      const { data: request, error } = await supabase.from('maintenance_requests').insert(input).select().single()
      if (error) throw error

      let failedPhotos = 0
      for (const file of photos.slice(0, MAX_PHOTOS)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${input.apartment_id}/${request.id}/${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
        if (up.error) {
          failedPhotos++
          continue
        }
        const ins = await supabase
          .from('request_photos')
          .insert({ request_id: request.id, storage_path: path, uploaded_by: input.created_by })
        if (ins.error) failedPhotos++
      }
      return { request, failedPhotos }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.all }),
  })
}

export function useUpdateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MaintenanceRequest> & { id: string }) => {
      const { data, error } = await supabase.from('maintenance_requests').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: requestKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.setQueryData(requestKeys.detail(data.id), (old: RequestRow | undefined) => (old ? { ...old, ...data } : old))
    },
  })
}

/** Admin-only notes; RLS returns nothing for tenants so this must only be called from admin pages. */
export function useAdminNote(requestId: string | undefined) {
  return useQuery({
    queryKey: [...requestKeys.detail(requestId ?? ''), 'admin-note'],
    enabled: !!requestId,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.from('request_admin_notes').select('body').eq('request_id', requestId!).maybeSingle()
      if (error) throw error
      return data?.body ?? ''
    },
  })
}

export function useSaveAdminNote(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, updated_by }: { body: string; updated_by: string }) => {
      const { error } = await supabase
        .from('request_admin_notes')
        .upsert({ request_id: requestId, body, updated_by }, { onConflict: 'request_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...requestKeys.detail(requestId), 'admin-note'] }),
  })
}

export type CommentRow = RequestComment & { author: { full_name: string; role: 'admin' | 'tenant' } | null }

export function useComments(requestId: string | undefined) {
  return useQuery({
    queryKey: requestKeys.comments(requestId ?? ''),
    enabled: !!requestId,
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await supabase
        .from('request_comments')
        .select('*, author:profiles!request_comments_author_id_fkey(full_name, role)')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as CommentRow[]
    },
  })
}

export function useAddComment(requestId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, author_id }: { body: string; author_id: string }) => {
      const { data, error } = await supabase
        .from('request_comments')
        .insert({ request_id: requestId, body, author_id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.comments(requestId) }),
  })
}

export type PhotoWithUrl = RequestPhoto & { url: string | null }

export function usePhotos(requestId: string | undefined) {
  return useQuery({
    queryKey: requestKeys.photos(requestId ?? ''),
    enabled: !!requestId,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<PhotoWithUrl[]> => {
      const { data, error } = await supabase.from('request_photos').select('*').eq('request_id', requestId!).order('created_at')
      if (error) throw error
      if (data.length === 0) return []
      const { data: signed, error: signErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(
          data.map((p) => p.storage_path),
          60 * 15,
        )
      if (signErr) throw signErr
      return data.map((p, i) => ({ ...p, url: signed?.[i]?.signedUrl ?? null }))
    },
  })
}
