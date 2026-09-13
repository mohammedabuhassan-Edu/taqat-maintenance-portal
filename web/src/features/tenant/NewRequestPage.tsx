import * as React from 'react'
import { useNavigate, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { useProfile } from '@/features/auth/AuthProvider'
import { MAX_PHOTOS, MAX_PHOTO_MB, PHOTO_TYPES, useCreateRequest } from '@/features/requests/api'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { tv } from '@/lib/forms'
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from '@/lib/database.types'

const schema = z.object({
  title: z.string().trim().min(3, 'validation.minLength|3').max(120, 'validation.maxLength|120'),
  description: z.string().trim().min(10, 'validation.minLength|10').max(2000, 'validation.maxLength|2000'),
  category: z.enum(REQUEST_CATEGORIES),
  priority: z.enum(REQUEST_PRIORITIES),
})
type FormValues = z.infer<typeof schema>

export function NewRequestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useProfile()
  const create = useCreateRequest()
  const [photos, setPhotos] = React.useState<File[]>([])
  const previews = React.useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])
  React.useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', category: 'plumbing', priority: 'normal' },
  })

  if (!me.apartment_id) return <Navigate to="/app" replace />

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const next = [...photos]
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) {
        toast.error(t('requests.tooManyPhotos', { max: MAX_PHOTOS }))
        break
      }
      if (!PHOTO_TYPES.includes(file.type)) {
        toast.error(t('requests.photoWrongType', { name: file.name }))
        continue
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(t('requests.photoTooLarge', { name: file.name, size: MAX_PHOTO_MB }))
        continue
      }
      next.push(file)
    }
    setPhotos(next)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync({
        ...values,
        apartment_id: me.apartment_id!,
        created_by: me.id,
        photos,
      })
      if (result.failedPhotos > 0) toast.warning(t('requests.photoUploadFailed'))
      else toast.success(t('requests.submitted'))
      navigate(`/app/requests/${result.request.id}`, { replace: true })
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  const err = form.formState.errors

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('requests.newTitle')} description={t('requests.newHint')} />
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field label={t('requests.fields.title')} htmlFor="title" error={tv(t, err.title?.message)}>
              <Input id="title" placeholder={t('requests.fields.titlePlaceholder')} maxLength={120} {...form.register('title')} aria-invalid={!!err.title} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('requests.fields.category')} htmlFor="category">
                <Select id="category" {...form.register('category')}>
                  {REQUEST_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`requests.category.${c}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('requests.fields.priority')} htmlFor="priority">
                <Select id="priority" {...form.register('priority')}>
                  {REQUEST_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`requests.priority.${p}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t('requests.fields.description')} htmlFor="description" error={tv(t, err.description?.message)}>
              <Textarea id="description" rows={5} placeholder={t('requests.fields.descriptionPlaceholder')} maxLength={2000} {...form.register('description')} aria-invalid={!!err.description} />
            </Field>

            <Field label={t('requests.fields.photos')} htmlFor="photos" optional={t('common.optional')} hint={t('requests.fields.photosHint', { max: MAX_PHOTOS, size: MAX_PHOTO_MB })}>
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative size-20 overflow-hidden rounded-lg border">
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      aria-label={t('common.delete')}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <label
                    htmlFor="photos"
                    className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-slate-400 hover:border-brand-400 hover:text-brand-600"
                  >
                    <ImagePlus className="size-5" />
                    <span className="text-[10px]">{t('common.add')}</span>
                    <input
                      id="photos"
                      type="file"
                      accept={PHOTO_TYPES.join(',')}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        addFiles(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                ) : null}
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={create.isPending}>
                {create.isPending ? t('requests.submitting') : t('requests.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
