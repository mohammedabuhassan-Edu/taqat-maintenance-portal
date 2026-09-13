import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pin, Pencil, Trash2 } from 'lucide-react'
import { useProfile } from '@/features/auth/AuthProvider'
import { useAnnouncements, useDeleteAnnouncement, useSaveAnnouncement } from '@/features/announcements/api'
import { Button } from '@/components/ui/button'
import { Checkbox, Input, Textarea } from '@/components/ui/input'
import { Field, Label } from '@/components/ui/field'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { tv } from '@/lib/forms'
import { formatDate } from '@/lib/utils'
import type { Announcement } from '@/lib/database.types'

const schema = z.object({
  title: z.string().trim().min(3, 'validation.minLength|3').max(120, 'validation.maxLength|120'),
  body: z.string().trim().min(5, 'validation.minLength|5').max(4000, 'validation.maxLength|4000'),
  pinned: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function AnnouncementDialog({ open, onOpenChange, announcement }: { open: boolean; onOpenChange: (o: boolean) => void; announcement: Announcement | null }) {
  const { t } = useTranslation()
  const me = useProfile()
  const save = useSaveAnnouncement()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { title: announcement?.title ?? '', body: announcement?.body ?? '', pinned: announcement?.pinned ?? false },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: announcement?.id, created_by: me.id, ...v })
      toast.success(t(announcement ? 'announcements.updated' : 'announcements.created'))
      onOpenChange(false)
      form.reset()
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  const err = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t(announcement ? 'announcements.editTitle' : 'announcements.new')} className="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label={t('announcements.fields.title')} htmlFor="an_title" error={tv(t, err.title?.message)}>
            <Input id="an_title" {...form.register('title')} autoFocus />
          </Field>
          <Field label={t('announcements.fields.body')} htmlFor="an_body" error={tv(t, err.body?.message)}>
            <Textarea id="an_body" rows={7} {...form.register('body')} />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox id="an_pinned" {...form.register('pinned')} />
            <Label htmlFor="an_pinned">{t('announcements.fields.pinned')}</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminAnnouncementsPage() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, error, refetch } = useAnnouncements()
  const del = useDeleteAnnouncement()
  const [editing, setEditing] = React.useState<Announcement | null | 'new'>(null)
  const [deleting, setDeleting] = React.useState<Announcement | null>(null)

  const onDelete = async () => {
    if (!deleting) return
    try {
      await del.mutateAsync(deleting.id)
      toast.success(t('announcements.deleted'))
      setDeleting(null)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const newButton = (
    <Button onClick={() => setEditing('new')}>
      <Plus />
      {t('announcements.new')}
    </Button>
  )

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('announcements.title')} actions={newButton} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('announcements.empty')} action={newButton} />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Card key={a.id} className={a.pinned ? 'border-brand-200 bg-brand-50/30' : undefined}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{a.title}</h2>
                      {a.pinned ? (
                        <Badge variant="brand" className="gap-1">
                          <Pin className="size-3" />
                          {t('announcements.pinned')}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t('announcements.published', { date: formatDate(a.published_at, i18n.language) })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={() => setEditing(a)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={t('common.delete')} className="text-red-600" onClick={() => setDeleting(a)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} announcement={editing === 'new' ? null : editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('common.areYouSure')}
        description={t('announcements.deleteConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  )
}
