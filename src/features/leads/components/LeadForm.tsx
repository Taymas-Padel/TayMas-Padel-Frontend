import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useManagers } from '@/hooks/useManagers'
import { LEAD_STAGES, LEAD_SOURCES } from '@/constants/leads'
import type { Lead, CreateLeadData } from '@/types/lead'

const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().min(10, 'Введите корректный номер'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  source: z.string().optional(),
  stage: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface LeadFormProps {
  defaultValues?: Partial<Lead>
  onSubmit: (data: CreateLeadData) => void
  isPending: boolean
  onCancel: () => void
}

export function LeadForm({ defaultValues, onSubmit, isPending, onCancel }: LeadFormProps) {
  const { managers } = useManagers()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      source: defaultValues?.source ?? '',
      stage: defaultValues?.stage ?? 'NEW',
      assigned_to: defaultValues?.assigned_to?.toString() ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  function handleFormSubmit(values: FormValues) {
    onSubmit({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      source: values.source as CreateLeadData['source'],
      stage: values.stage as CreateLeadData['stage'],
      assigned_to: values.assigned_to && values.assigned_to !== '_none' ? parseInt(values.assigned_to) : null,
      notes: values.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Имя *</Label>
          <Input {...register('name')} placeholder="Иван Петров" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Телефон *</Label>
          <Input {...register('phone')} placeholder="+7 777 123 4567" />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input {...register('email')} placeholder="email@example.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Источник</Label>
          <Select value={watch('source')} onValueChange={(v) => setValue('source', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите источник" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_SOURCES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Стадия</Label>
          <Select value={watch('stage')} onValueChange={(v) => setValue('stage', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите стадию" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_STAGES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Менеджер</Label>
        <Select
          value={watch('assigned_to') || '_none'}
          onValueChange={(v) => setValue('assigned_to', v === '_none' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Назначить менеджера" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Не назначен</SelectItem>
            {managers.map((m) => {
              const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.phone_number || m.username
              return (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Заметки</Label>
        <Textarea {...register('notes')} placeholder="Дополнительная информация..." className="resize-none" rows={3} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {defaultValues ? 'Сохранить' : 'Создать лид'}
        </Button>
      </div>
    </form>
  )
}
