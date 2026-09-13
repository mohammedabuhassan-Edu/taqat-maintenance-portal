import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const announcementKeys = { all: ['announcements'] as const }

export function useAnnouncements(limit?: number) {
  return useQuery({
    queryKey: [...announcementKeys.all, limit ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false })
      if (limit) q = q.limit(limit)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export interface AnnouncementInput {
  title: string
  body: string
  pinned: boolean
}

export function useSaveAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, created_by, ...input }: AnnouncementInput & { id?: string; created_by: string }) => {
      if (id) {
        const { data, error } = await supabase.from('announcements').update(input).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase.from('announcements').insert({ ...input, created_by }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: announcementKeys.all }),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: announcementKeys.all }),
  })
}
