import { Badge } from '@/components/ui/badge'
import { ActivityLog } from '@/types/ActivityLog'
import { Project } from '@/types/project'
import { getDuration } from '@/utils/getDuration'
import { getStatusBadge } from '@/utils/getStatusBadge'
import { getStatusLabel } from '@/utils/getStatusLabel'

export const activityLogsColumns = [
  {
    title: 'User',
    render: (log: ActivityLog) => log?.metadata?.userEmail,
  },
  {
    title: 'Action',
    render: (log: ActivityLog) => log.action,
  },
  {
    title: 'Cambios',
    render: (log: ActivityLog) => {
      const updates = log?.metadata?.updates
      if (!updates || typeof updates !== 'object') return ''
      return Object.keys(updates).join(', ')
    },
  },
  {
    title: 'Fecha',
    render: (log: ActivityLog) => log.created_at,
  },
]
