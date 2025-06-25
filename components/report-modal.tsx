'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePickerWithRange } from '@/components/date-range-picker'
import { CalendarRange, Loader2, Download, FileSpreadsheet } from 'lucide-react'
import { fetchOcupationReport } from '@/lib/services/reports.service'
import { supabase } from '@/lib/supabase/client'
import { parseDateFromString } from '@/lib/assignments'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { cn } from '@/utils/classnames'
import { Badge } from '@/components/ui/badge'

interface ReportData {
  person_id: string
  person_first_name: string
  person_last_name: string
  person_profile: string
  person_status: string
  project_name: string
  project_status: string
  allocation: number
  allocation_percentage: number
  start_date: string
  end_date: string
  assigned_role?: string
  is_bench: boolean
  is_billable: boolean
}

export function ReportModal() {
  const [range, setRange] = useState<{ from: Date | undefined; to: Date |undefined }>(() => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: firstDayOfMonth, to: today }
  })
  const [report, setReport] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleGenerate = async () => {
    if (!range?.from || !range?.to) {
      toast.error('Por favor selecciona un rango de fechas')
      return
    }
    
    setLoading(true)
    try {
      const from = format(range.from, 'yyyy-MM-dd')
      const to = format(range.to, 'yyyy-MM-dd')
      const data = await fetchOcupationReport(from, to)
      setReport(data)
      toast.success('Reporte generado correctamente')
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const generateExcel = async (data: ReportData[]) => {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    // Prepare data for Excel with FTE information
    const excelData = data.map(item => ({
      'First Name': item.person_first_name,
      'Last Name': item.person_last_name,
      'Profile': item.person_profile,
      'Project': item.is_bench ? 'Bench' : item.project_name,
      'Fecha Inicio': format(parseDateFromString(item.start_date), 'dd/MM/yyyy'),
      'Fecha Fin': format(parseDateFromString(item.end_date), 'dd/MM/yyyy'),
      'Asignación %': item.allocation_percentage,
      'FTE': item.allocation.toFixed(2),
      'Tipo': item.is_bench ? 'Bench' : 'Proyecto',
      'Facturable': item.is_billable ? 'Sí' : 'No'
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte FTE')

    return workbook
  }

  const handleExportAndSave = async () => {
    setExporting(true)
    try {
      const workbook = await generateExcel(report)
      if (!workbook) {
        toast.error('No hay datos para exportar')
        return
      }
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      if (!range?.from || !range?.to) {
        toast.error("Rango de fechas incompleto")
        return
      }

      const fileName = `reporte-ocupacion-${format(range!.from, 'yyyy-MM-dd')}-${format(range!.to, 'yyyy-MM-dd')}-${Date.now()}.xlsx`
      
      // Save to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(`ocupacion/${fileName}`, blob, { 
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

      if (uploadError) {
        // Check if it's an RLS policy error
        if (uploadError.message?.includes('row-level security policy')) {
          throw new Error('Error de permisos: Necesitas configurar las políticas de Storage en Supabase. Ve a Storage → Policies → reports')
        }
        
        throw new Error(`Error al subir archivo: ${uploadError.message}`)
      }

      // Download to local machine
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      const { data: publicUrl } = supabase.storage
        .from('reports')
        .getPublicUrl(`ocupacion/${fileName}`)

      toast.success('Reporte exportado y guardado correctamente')
    } catch (error) {
      toast.error(`Error al exportar y guardar el reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setExporting(false)
    }
  }

  // Calculate summary statistics
  const summary = {
    totalAssignments: report.length,
    totalPeople: new Set(report.map(r => `${r.person_first_name} ${r.person_last_name}`)).size,
    totalProjects: new Set(report.filter(r => !r.is_bench).map(r => r.project_name)).size,
    totalBench: report.filter(r => r.is_bench).length,
    totalFTE: report.reduce((sum, r) => sum + r.allocation, 0),
    overallocated: report.filter(r => r.allocation > 1.0).length,
    underutilized: report.filter(r => r.allocation < 0.5).length,
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
        >
          <CalendarRange className="mr-2 h-4 w-4" />
          Reporte
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reporte de Ocupación</DialogTitle>
          <DialogDescription>
            Genera reportes de ocupación de personas por proyectos en un rango de fechas específico.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Controls */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <DatePickerWithRange
              date={range}
              setDate={({ from, to }) => {
                setRange(f => ({ ...f, from,  to }))
              }}
            />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generar Reporte
            </Button>
          </div>

          {report.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 w-full">
                <Card className='bg-gray-100'>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Total FTE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalFTE.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{summary.totalAssignments} asignaciones</div>
                  </CardContent>
                </Card>
                <Card className='bg-gray-100'>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Personas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalPeople}</div>
                  </CardContent>
                </Card>
                <Card className='bg-gray-100'>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Proyectos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalProjects}</div>
                  </CardContent>
                </Card>
                <Card className='bg-gray-100'>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Bench</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalBench}</div>
                    <div className="text-xs text-gray-500">asignaciones</div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Table */}
              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Persona</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Asignación</TableHead>
                      <TableHead>FTE</TableHead>
                      <TableHead>Facturable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((r, index) => (
                      <TableRow 
                        key={`${r.person_id}-${r.project_name}-${index}`}
                        className={cn(
                          r.is_bench && 'bg-gray-50 dark:bg-blue-950/20',
                          'hover:bg-muted/50'
                        )}
                      >
                        <TableCell className="font-medium">
                          {r.person_first_name} {r.person_last_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.person_profile}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className={`font-medium ${r.is_bench ? 'text-gray-600 italic' : 'text-blue-600'}`}>
                            {r.is_bench ? 'Bench' : r.project_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="text-sm text-gray-600">
                            {format(parseDateFromString(r.start_date), 'dd/MM/yyyy')} - {format(parseDateFromString(r.end_date), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className={`font-medium ${r.is_bench ? 'text-gray-600' : 'text-green-600'}`}>
                            {r.allocation_percentage}%
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-sm font-medium">{r.allocation.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={r.is_billable ? 'default' : 'secondary'} className="text-xs">
                            {r.is_billable ? 'Sí' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Export Button - Bottom Right */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleExportAndSave} disabled={exporting}>
                  {exporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel
                </Button>
              </div>
            </>
          )}

          {report.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Selecciona un rango de fechas y genera un reporte</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}