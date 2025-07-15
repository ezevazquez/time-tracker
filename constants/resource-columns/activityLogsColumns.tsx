import { ActivityLog } from '@/types/ActivityLog'
import { renderDate } from '@/utils/renderDate'

export const activityLogsColumns = [
  {
    title: 'Usuario',
    render: (log: ActivityLog) => log?.display_name,
  },
  {
    title: 'Action',
    render: (log: ActivityLog) =>
      <div>
        <div className='text-sm text-muted-foreground'>{log.action} {log.field_name || ''} to {log.table_name || ''}</div>
        {log.action !== 'INSERT' && (
          <div className='text-sm text-muted-foreground'>From: {log.old_value || ''}</div>
        )}
        {log.action === 'INSERT' && (
          <div className='text-md'>Valor: {log.new_value || ''}</div>
        )}
      </div>
  },
  {
    title: 'Fecha',
    render: (log: ActivityLog) => renderDate(log.created_at),
  },
]
