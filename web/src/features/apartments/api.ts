import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Apartment, Profile } from '@/lib/database.types'

export const apartmentKeys = {
  all: ['apartments'] as const,
  detail: (id: string) => ['apartments', id] as const,
}

async function throwIfError<T>(res: { data: T | null; error: unknown }): Promise<NonNullable<T>> {
  if (res.error) throw res.error
  if (res.data === null || res.data === undefined) throw new Error('No data returned')
  return res.data as NonNullable<T>
}

export function useApartments() {
  return useQuery({
    queryKey: apartmentKeys.all,
    queryFn: async () =>
      throwIfError(await supabase.from('apartments').select('*').order('unit_number', { ascending: true })),
  })
}

export type ApartmentWithTenants = Apartment & { tenants: Pick<Profile, 'id' | 'full_name' | 'email' | 'is_active'>[] }

export function useApartmentsWithTenants() {
  return useQuery({
    queryKey: [...apartmentKeys.all, 'with-tenants'],
    queryFn: async (): Promise<ApartmentWithTenants[]> => {
      const [apartments, profiles] = await Promise.all([
        throwIfError(await supabase.from('apartments').select('*').order('unit_number')),
        throwIfError(
          await supabase.from('profiles').select('id, full_name, email, is_active, apartment_id').eq('role', 'tenant'),
        ),
      ])
      const byApt = new Map<string, ApartmentWithTenants['tenants']>()
      for (const p of profiles) {
        if (!p.apartment_id) continue
        const list = byApt.get(p.apartment_id) ?? []
        list.push({ id: p.id, full_name: p.full_name, email: p.email, is_active: p.is_active })
        byApt.set(p.apartment_id, list)
      }
      return apartments.map((a) => ({ ...a, tenants: byApt.get(a.id) ?? [] }))
    },
  })
}

export function useApartment(id: string | undefined) {
  return useQuery({
    queryKey: apartmentKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Apartment> => {
      const { data, error } = await supabase.from('apartments').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

export interface ApartmentInput {
  unit_number: string
  floor: number | null
  notes: string | null
}

export function useSaveApartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: ApartmentInput & { id?: string }) => {
      if (id) return throwIfError(await supabase.from('apartments').update(input).eq('id', id).select().single())
      return throwIfError(await supabase.from('apartments').insert(input).select().single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: apartmentKeys.all }),
  })
}

export function useDeleteApartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => throwIfError(await supabase.from('apartments').delete().eq('id', id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apartmentKeys.all })
      void qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
