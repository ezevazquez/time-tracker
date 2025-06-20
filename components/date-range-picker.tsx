'use client'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

import { cn } from '@/utils/classnames'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string
  date: { from: Date | undefined; to: Date | undefined }
  setDate: (date: { from: Date | undefined; to: Date | undefined }) => void
}) {
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Start Date Picker */}
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-[140px] justify-start text-left font-normal',
              !date?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? format(date.from, 'dd/MM/yyyy') : 'Desde'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date.from}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                setDate({ ...date, from: selectedDate })
                setStartOpen(false)
              }
            }}
            disabled={(selectedDate) => {
              return !!selectedDate && selectedDate > new Date();
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-gray-500">hasta</span>

      {/* End Date Picker */}
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-[140px] justify-start text-left font-normal',
              !date?.to && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.to ? format(date.to, 'dd/MM/yyyy') : 'Hasta'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date.to}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                setDate({ ...date, to: selectedDate })
                setEndOpen(false)
              }
            }}
            disabled={(selectedDate) => {
              return !!selectedDate && (selectedDate > new Date() || (date.from ? selectedDate < date.from : false));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
