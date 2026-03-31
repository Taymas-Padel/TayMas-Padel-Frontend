import { AxiosError } from 'axios'

export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    const status = error.response?.status
    if (!data) return error.message || `Ошибка ${status ?? ''}`

    // { detail: "..." }
    if (typeof data.detail === 'string') return data.detail

    // { error: "..." }
    if (typeof data.error === 'string') return data.error

    // { non_field_errors: ["..."] } (Django REST)
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors.join('. ')
    }

    // { field: ["message"] } (Django) — показывать имя поля и текст
    const fieldLabels: Record<string, string> = {
      name: 'Название',
      price: 'Цена',
      days_valid: 'Дней действия',
      total_hours: 'Часов',
      total_visits: 'Посещений',
      discount_on_court: 'Скидка на корт',
      description: 'Описание',
      service_type: 'Тип услуги',
      is_active: 'Активен',
    }
    const fieldErrors = Object.entries(data)
      .filter(([, v]) => Array.isArray(v) || typeof v === 'string')
      .flatMap(([key, v]) => {
        const label = fieldLabels[key] || key
        return (Array.isArray(v) ? v : [v]).map((s) => `${label}: ${typeof s === 'string' ? s : String(s)}`)
      })
    if (fieldErrors.length > 0) return fieldErrors.join('. ')

    // для 400 в dev вывести тело, чтобы понять требование бэкенда
    if (status === 400 && import.meta.env.DEV) {
      console.warn('[API 400] Ответ бэкенда:', data)
    }
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      return JSON.stringify(data)
    }
  }

  if (error instanceof Error) return error.message

  return 'Произошла неизвестная ошибка'
}
