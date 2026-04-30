/**
 * Файлы лежат в `public/brand/` (источники — `brand/logo/SVG/`).
 * Используем разные lockup’ы там, где разный фон и иерархия.
 */
/** Полный горизонтальный lockup — цветной (#033431 + #00CA74), светлый фон */
export const BRAND_LOGO_LIGHT = '/brand/logo-full.svg'

/** Полный горизонтальный — кремовый текст + зелёный акцент, тёмный ink-фон */
export const BRAND_LOGO_ON_DARK = '/brand/logo-on-dark.svg'

/** Полный горизонтальный — моно белый (BW `taymaslogofinal-05`), тёмный фон, плоский стиль */
export const BRAND_LOGO_FULL_WHITE = '/brand/logo-full-white.svg'

/** Только знак — зелёный #00CA74 (`taymaslogofinal-10`), акцент на борде ink / светлая шапка */
export const BRAND_MARK_GREEN = '/brand/logo-mark-green.svg'

/** Только знак — белый (`taymaslogofinal-04` BW), тёмная панель при необходимости моно */
export const BRAND_MARK_WHITE = '/brand/logo-mark-on-dark.svg'

/** @deprecated используйте BRAND_MARK_WHITE */
export const BRAND_LOGO_MARK_ON_DARK = BRAND_MARK_WHITE
