import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchClients } from '@/api/clients'
import { useDebounce } from '@/hooks/useDebounce'
import type { ClientUser } from '@/types/client'
import { formatPhone, fullName } from '@/utils/format'

interface ClientSearchProps {
  onSelect: (client: ClientUser) => void
  selectedClient?: ClientUser | null
  onClear?: () => void
  placeholder?: string
}

export function ClientSearch({
  onSelect,
  selectedClient,
  onClear,
  placeholder = 'Поиск по имени или телефону...',
}: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: clients = [], isFetching } = useQuery({
    queryKey: ['client-search', debouncedQuery],
    queryFn: () => searchClients(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedClient) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {fullName(selectedClient.first_name, selectedClient.last_name) || selectedClient.phone_number}
          </p>
          <p className="text-xs text-muted-foreground">{formatPhone(selectedClient.phone_number)}</p>
        </div>
        {onClear && (
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          className="pl-9"
        />
      </div>

      {open && debouncedQuery.trim().length >= 2 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isFetching && (
            <div className="p-3 text-sm text-muted-foreground text-center">Поиск...</div>
          )}
          {!isFetching && clients.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center">Не найдено</div>
          )}
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
              onMouseDown={(e) => {
                e.preventDefault() // prevent input blur before click fires
                onSelect(client)
                setQuery('')
                setOpen(false)
              }}
            >
              <p className="text-sm font-medium">
                {fullName(client.first_name, client.last_name) || client.phone_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPhone(client.phone_number)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
