import { ActivityLog } from '@/types/ActivityLog'

export const activityLogsColumns = [
  {
    title: 'Usuario',
    render: (log: ActivityLog) => log?.display_name,
  },
  {
    title: 'Action',
    render: (log: ActivityLog) => log.action,
  },
  {
    title: 'Fecha',
    render: (log: ActivityLog) => log.created_at,
  },
]
