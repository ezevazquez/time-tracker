'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { assignmentsService } from '@/lib/services/assignments.service'
import { usePeople } from '@/hooks/use-people'
import { useProjects } from '@/hooks/use-projects'
import { useAssignments } from '@/hooks/use-assignments'
import { supabase } from '@/lib/supabase/client'
import { parseDateFromString } from '@/lib/assignments'

export function DebugOverallocation() {
  const [debugResult, setDebugResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { people } = usePeople()
  const { projects } = useProjects()
  const { assignments } = useAssignments()

  const runDebug = async () => {
    if (people.length === 0 || projects.length < 2) {
      setDebugResult({ error: 'Necesitas al menos 1 persona y 2 proyectos' })
      return
    }

    setIsLoading(true)
    try {
      const person = people[0]
      const project1 = projects[0]
      const project2 = projects[1]

      console.log('🔍 DEBUG: Iniciando diagnóstico...')
      console.log('Persona:', person.first_name, person.last_name, 'ID:', person.id)
      console.log('Proyecto 1:', project1.name, 'ID:', project1.id)
      console.log('Proyecto 2:', project2.name, 'ID:', project2.id)

      // Fecha de prueba (hoy)
      const testDate = new Date()
      const dateStr = testDate.toISOString().split('T')[0]

      // 1. Verificar asignaciones existentes
      console.log('1. Verificando asignaciones existentes...')
      const overlappingAssignments = assignments.filter(a => 
        a.person_id === person.id &&
        parseDateFromString(a.start_date) <= testDate &&
        parseDateFromString(a.end_date) >= testDate
      )

      console.log('Asignaciones existentes en la fecha:', overlappingAssignments)
      const totalExistingAllocation = overlappingAssignments.reduce((sum, a) => sum + a.allocation, 0)
      console.log('Asignación total existente:', totalExistingAllocation)

      // 2. Crear primera asignación (75%)
      console.log('2. Creando primera asignación (75%)...')
      const assignment1 = await assignmentsService.create({
        person_id: person.id,
        project_id: project1.id,
        start_date: dateStr,
        end_date: dateStr,
        allocation: 0.75,
        assigned_role: 'Debug Test 1',
        is_billable: true
      })

      console.log('✅ Asignación 1 creada:', assignment1.id)

      // 3. Esperar un momento y obtener los datos actualizados
      console.log('3. Esperando sincronización de datos...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 4. Obtener asignaciones actualizadas directamente de la base de datos
      console.log('4. Obteniendo asignaciones actualizadas...')
      const { data: updatedAssignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('person_id', person.id)
        .gte('start_date', dateStr)
        .lte('end_date', dateStr)

      if (error) {
        console.error('Error obteniendo asignaciones:', error)
        throw error
      }

      console.log('Asignaciones actualizadas desde DB:', updatedAssignments)
      const totalAfterFirst = updatedAssignments.reduce((sum: number, a: any) => sum + a.allocation, 0)
      console.log('Asignación total después de la primera (desde DB):', totalAfterFirst)

      // 5. Probar validación para segunda asignación (50%)
      console.log('5. Probando validación para segunda asignación (50%)...')
      const validationResult = await assignmentsService.checkAssignmentOverallocation(
        null,
        person.id,
        dateStr,
        dateStr,
        0.5
      )

      console.log('📊 Resultado de validación:', validationResult)

      // 6. Verificar manualmente
      console.log('6. Verificación manual...')
      const manualTotal = totalAfterFirst + 0.5
      console.log('Total manual (existente + nueva):', totalAfterFirst, '+', 0.5, '=', manualTotal)
      console.log('¿Debería detectar sobreasignación?', manualTotal > 1)

      // 7. Limpiar
      console.log('7. Limpiando datos de prueba...')
      await assignmentsService.delete(assignment1.id)

      setDebugResult({
        success: true,
        person: `${person.first_name} ${person.last_name}`,
        date: dateStr,
        existingAssignments: overlappingAssignments.length,
        totalExistingAllocation,
        totalAfterFirst,
        manualTotal,
        shouldDetect: manualTotal > 1,
        validationResult,
        validationDetected: validationResult.isOverallocated,
        updatedAssignmentsFromDB: updatedAssignments
      })

    } catch (error) {
      console.error('❌ Error en debug:', error)
      setDebugResult({ error: error instanceof Error ? error.message : 'Error desconocido' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Debug: Validación de Sobreasignación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Este debug:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Verifica asignaciones existentes</li>
            <li>Crea una asignación del 75%</li>
            <li>Intenta crear otra del 50%</li>
            <li>Compara el resultado manual vs la función</li>
          </ul>
        </div>

        <Button 
          onClick={runDebug} 
          disabled={isLoading || people.length === 0 || projects.length < 2}
          className="w-full"
        >
          {isLoading ? 'Ejecutando debug...' : 'Ejecutar Debug'}
        </Button>

        {debugResult && (
          <div className="mt-4 p-4 border rounded-lg space-y-2">
            {debugResult.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {debugResult.error}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-green-600">
                  <strong>✅ Debug completado</strong>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Persona:</strong> {debugResult.person}
                  </div>
                  <div>
                    <strong>Fecha:</strong> {debugResult.date}
                  </div>
                  <div>
                    <strong>Asignaciones existentes:</strong> {debugResult.existingAssignments}
                  </div>
                  <div>
                    <strong>Total existente:</strong> {debugResult.totalExistingAllocation}
                  </div>
                  <div>
                    <strong>Total después de 75%:</strong> {debugResult.totalAfterFirst}
                  </div>
                  <div>
                    <strong>Total manual (75% + 50%):</strong> {debugResult.manualTotal}
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="font-medium">Resultados:</div>
                  <div className="text-sm space-y-1">
                    <div>¿Debería detectar sobreasignación? <strong>{debugResult.shouldDetect ? '✅ SÍ' : '❌ NO'}</strong></div>
                    <div>¿La función detectó sobreasignación? <strong>{debugResult.validationDetected ? '✅ SÍ' : '❌ NO'}</strong></div>
                    <div>¿Coinciden? <strong>{debugResult.shouldDetect === debugResult.validationDetected ? '✅ SÍ' : '❌ NO - HAY PROBLEMA'}</strong></div>
                  </div>
                </div>

                <div>
                  <strong>Resultado de la función:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(debugResult.validationResult, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Asignaciones desde DB después de crear la primera:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(debugResult.updatedAssignmentsFromDB, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 