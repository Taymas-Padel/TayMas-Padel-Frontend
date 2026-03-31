export type CourtType = 'INDOOR' | 'OUTDOOR' | 'PANORAMIC' | 'SQUASH' | 'PING_PONG'
export type PlayFormat = 'TWO_VS_TWO' | 'ONE_VS_ONE'

export interface CourtPriceSlot {
  id?: number
  start_time: string   // "HH:MM"
  end_time: string     // "HH:MM" — 00:00 означает конец суток (полночь)
  price_per_hour: string
}

export interface Court {
  id: number
  name: string
  court_type: CourtType
  play_format: PlayFormat
  description: string | null
  price_per_hour: string
  price_slots: CourtPriceSlot[]
  image: string | null
  gallery: Array<{ id: number; image: string }>
  is_active: boolean
}

export interface Coach {
  id: number
  full_name: string
  first_name: string
  last_name: string
  role: 'COACH_PADEL' | 'COACH_FITNESS'
  coach_price: number
  coach_price_1_2: number | null
  coach_price_3_4: number | null
  rating_elo: number
  avatar: string | null
}

export type ServiceGroup = 'PADEL' | 'GYM' | 'RECOVERY' | 'SPORT_BAR' | 'OTHER'
export type ServiceCategory = 'INVENTORY' | 'SERVICE' | 'FOOD' | 'DRINK' | 'EVENT'

export interface Service {
  id: number
  name: string
  description: string | null
  price: string
  group: ServiceGroup
  category: ServiceCategory
  image: string | null
  is_active: boolean
}

export interface MarketingPromo {
  id: number
  title: string
  description: string | null
  image_url: string | null
  priority: number
  promo_code: string | null
  discount_type: 'PERCENT' | 'FIXED'
  discount_value: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface NewsItem {
  id: number
  title: string
  content: string
  category: 'NEWS' | 'EVENT' | 'PROMO' | 'ANNOUNCEMENT'
  category_label: string
  image_url: string | null
  is_pinned: boolean
  created_at: string
  created_at_formatted: string
}
