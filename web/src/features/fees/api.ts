import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Fee, FeeStatus } from '@/lib/database.types'

export const feeKeys = {
  all: ['fees'] as const,
  list: (f: FeeFilters) => ['fees', 'list', f] as const,
}

export interface FeeFilters {
  apartment_id?: string
  status?: FeeStatus | ''
}

export type FeeRow = Fee & { apartments: { unit_number: string } | null }

export function useFees(filters: FeeFilters = {}) {
  return useQuery({
    queryKey: feeKeys.list(filters),
    queryFn: async (): Promise<FeeRow[]> => {
      let q = supabase
        .from('fees')
        .select('*, apartments(unit_number)')
        .order('due_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (filters.apartment_id) q = q.eq('apartment_id', filters.apartment_id)
      if (filters.status) q = q.eq('status', filters.status)
      const { data, error } = await q
      if (error) throw error
      return data as unknown as FeeRow[]
    },
  })
}

export function summarize(fees: Pick<Fee, 'amount' | 'status'>[]) {
  let unpaid = 0
  let paid = 0
  let unpaidCount = 0
  for (const f of fees) {
    if (f.status === 'paid') paid += Number(f.amount)
    else {
      unpaid += Number(f.amount)
      unpaidCount++
    }
  }
  return { unpaid, paid, unpaidCount }
}

export interface FeeInput {
  title: string
  amount: number
  due_date: string
  note: string | null
  /** one apartment id, or 'all' */
  target: string
}

export function useCreateFees() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ target, ...input }: FeeInput): Promise<number> => {
      let apartmentIds: string[]
      if (target === 'all') {
        const { data, error } = await supabase.from('apartments').select('id')
        if (error) throw error
        apartmentIds = data.map((a) => a.id)
      } else {
        apartmentIds = [target]
      }
      if (apartmentIds.length === 0) return 0
      const rows = apartmentIds.map((apartment_id) => ({ ...input, apartment_id }))
      const { error } = await supabase.from('fees').insert(rows)
      if (error) throw error
      return rows.length
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: feeKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Fee> & { id: string }) => {
      const { data, error } = await supabase.from('fees').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: feeKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: feeKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
