import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TableResource } from '@/components/ui/table-resource'
import { activityLogsColumns } from '@/constants/resource-columns/activityLogsColumns'
import { peopleService } from '@/lib/services/people.service'
import { Button } from '@/components/ui/button'

interface ProjectAuditLogProps {
  projectCode: string
  version?: number // Version-based refresh
}

const LOGS_PAGE_SIZE = 20

export function ProjectAuditLog({ projectCode, version }: ProjectAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let isMounted = true
    async function fetchLogs() {
      setLoading(true)
      setError(null)
      try {
        let { data: activityLogs, error, count } = await supabase.rpc('get_audit_logs_for_project_code', {
          p_project_code: projectCode,
          p_limit: LOGS_PAGE_SIZE,
          p_offset: (page - 1) * LOGS_PAGE_SIZE,
        })
        if (error) throw error
        // Obtener user_ids únicos
        const userIds = [...new Set((activityLogs || []).map((log: any) => log.changed_by).filter(Boolean))]
        const peopleMap: Record<string, { first_name: string; last_name: string }> = {}
        const usersMap: Record<string, { email: string }> = {}
        await Promise.all(
          userIds.map(async (userId) => {
            if (typeof userId !== 'string') return
            try {
              const person = await peopleService.getById(userId)
              if (person) {
                peopleMap[userId] = { first_name: person.first_name, last_name: person.last_name }
              } else {
                const { data: user, error: userError } = await supabase
                  .from('users')
                  .select('email')
                  .eq('id', userId)
                  .single()
                if (!userError && user) {
                  usersMap[userId] = { email: user.email }
                }
              }
            } catch {}
          })
        )
        // Mapear logs
        const mappedLogs = (activityLogs || []).map((log: any) => {
          if(["is_archived","project_code","id"].includes(log.field_name)) return null
          
          let displayName = 'Desconocido';
          if (log.changed_by_name?.trim()) {
            displayName = log.changed_by_name;
          } else if (log.changed_by_email?.trim()) {
            displayName = log.changed_by_email;
          } else if (log.changed_by && peopleMap[log.changed_by]) {
            displayName = `${peopleMap[log.changed_by].first_name} ${peopleMap[log.changed_by].last_name}`;
          } else if (log.changed_by && usersMap[log.changed_by]) {
            displayName = usersMap[log.changed_by].email;
          } else if (log.changed_by) {
            displayName = log.changed_by;
          }
          return {
            id: log.id,
            user_id: log.changed_by,
            display_name: displayName,
            action: log.action,
            table_name: log.table_name,
            old_value: log.old_value,
            new_value: log.new_value,
            field_name: log.field_name,
            resource_type: log.table_name,
            resource_id: log.record_id,
            metadata: null,
            created_at: log.changed_at,
          }
        }).filter(Boolean)
        if (isMounted) {
          setLogs(mappedLogs)
          setTotal(count || 0)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error al cargar logs')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLogs()
    return () => { isMounted = false }
  }, [projectCode, page, version])

  const totalPages = Math.max(1, Math.ceil(total / LOGS_PAGE_SIZE))
  const from = (page - 1) * LOGS_PAGE_SIZE + 1
  const to = from + logs.length - 1

  return (
    <div className="space-y-2">
      <TableResource items={logs} columns={activityLogsColumns} />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4">
        <div className="text-xs text-muted-foreground">
          {loading ? 'Cargando...' :
            error ? <span className="text-red-600">{error}</span> :
            total > 0 ? `Mostrando ${from}-${to} de ${total}` : 'Sin registros'}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >Anterior</Button>
          <span className="text-xs">Página {page} de {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading || logs.length < LOGS_PAGE_SIZE}
          >Siguiente</Button>
        </div>
      </div>
    </div>
  )
} 