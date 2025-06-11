'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { DatePickerWithRange } from '@/components/date-range-picker'
import { CalendarRange, Loader2 } from 'lucide-react'
import { fetchOcupationReport } from '@/lib/services/reports.service'

export function ReportModal() {
  const [range, setRange] = useState<{ from: Date; to: Date } | undefined>()
  const [report, setReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!range?.from || !range?.to) return
    setLoading(true)
    const from = format(range.from, 'yyyy-MM-dd')
    const to = format(range.to, 'yyyy-MM-dd')
    const data = await fetchOcupationReport(from, to)
    setReport(data)
    setLoading(false)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <CalendarRange className="mr-2 h-4 w-4" />
          Nuevo reporte
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Reporte de Ocupación</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <DatePickerWithRange
              date={range || { from: new Date(), to: new Date() }}
              setDate={setRange}
            />
            <Button onClick={handleGenerate} disabled={loading || !range?.from || !range?.to}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generar
            </Button>
          </div>

          {report.length > 0 && (
            <div className="overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Asignación (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map(r => (
                    <TableRow key={r.assignment_id}>
                      <TableCell>
                        {r.person_first_name} {r.person_last_name}
                      </TableCell>
                      <TableCell>{r.project_name}</TableCell>
                      <TableCell>
                        {r.assignment_start_date} → {r.assignment_end_date}
                      </TableCell>
                      <TableCell>{r.allocation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
