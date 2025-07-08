import { Input } from './ui/input'
import { Search } from 'lucide-react'
import { ReactNode } from 'react'

interface ResourceSubheaderProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filtersComponent?: ReactNode
  toggleComponent?: ReactNode
  children?: ReactNode
}

export function ResourceSubheader({ searchPlaceholder, searchValue, onSearchChange, filtersComponent, toggleComponent, children }: ResourceSubheaderProps) {
  return (
    <div className="flex-shrink-0 border-b bg-gray-50 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-end gap-2">
          {/* Buscador a la izquierda */}
          <div className="flex-1 flex justify-start">
            <div className="w-full max-w-xs relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="bg-white pl-10"
              />
            </div>
          </div>
          {filtersComponent}
          {toggleComponent}
          {children}
        </div>
      </div>
    </div>
  )
} 