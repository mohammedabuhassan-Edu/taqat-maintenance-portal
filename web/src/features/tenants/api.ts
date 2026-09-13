import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import { apartmentKeys } from '@/features/apartments/api'
import { appUrl } from '@/lib/urls'

export const tenantKeys = {
  all: ['tenants'] as const,
  byApartment: (id: string) => ['tenants', 'apartment', id] as const,
}

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useTenantsByApartment(apartmentId: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.byApartment(apartmentId ?? ''),
    enabled: !!apartmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('apartment_id', apartmentId!)
        .order('full_name')
      if (error) throw error
      return data
    },
  })
}

export interface InviteTenantInput {
  email: string
  full_name: string
  phone?: string | null
  apartment_id: string
  preferred_lang: 'en' | 'ar'
}

export function useInviteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InviteTenantInput) => {
      const { data, error } = await supabase.functions.invoke<{ id: string }>('invite-tenant', {
        body: { ...input, redirect_to: appUrl('/set-password') },
      })
      if (error) {
        // FunctionsHttpError carries the JSON body on .context
        const ctx = (error as { context?: Response }).context
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = (await ctx.json()) as { error?: { code?: string; message?: string } }
            throw { status: ctx.status, ...body }
          } catch (parsed) {
            if (parsed && typeof parsed === 'object' && 'status' in parsed) throw parsed
          }
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tenantKeys.all })
      void qc.invalidateQueries({ queryKey: apartmentKeys.all })
    },
  })
}

export type TenantUpdate = Partial<Pick<Profile, 'full_name' | 'phone' | 'apartment_id' | 'preferred_lang' | 'is_active'>>

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: TenantUpdate & { id: string }) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tenantKeys.all })
      void qc.invalidateQueries({ queryKey: apartmentKeys.all })
    },
  })
}
