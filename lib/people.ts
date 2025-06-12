import { Person } from '@/types/people'
import {
  ACTIVE_PERSON_STATUSES,
  INACTIVE_PERSON_STATUSES,
  PERSON_STATUS,
} from '@/constants/people'

export function getActivePeople(people: Person[]) {
  return people.filter(p =>
    ACTIVE_PERSON_STATUSES.includes(p.status as (typeof ACTIVE_PERSON_STATUSES)[number])
  )
}

export function getInactivePeople(people: Person[]) {
  return people.filter(p =>
    INACTIVE_PERSON_STATUSES.includes(p.status as (typeof INACTIVE_PERSON_STATUSES)[number])
  )
}

export function getPersonStatusLabel(status: string): string {
  switch (status) {
    case PERSON_STATUS.ACTIVE:
      return 'Activo'
    case PERSON_STATUS.PAUSED:
      return 'Pausado'
    case PERSON_STATUS.TERMINATED:
      return 'Terminado'
    default:
      return status
  }
}

export function getPersonStatusBadge(
  status: string
): 'success' | 'warning' | 'destructive' | 'default' {
  switch (status) {
    case PERSON_STATUS.ACTIVE:
      return 'success'
    case PERSON_STATUS.PAUSED:
      return 'warning'
    case PERSON_STATUS.TERMINATED:
      return 'destructive'
    default:
      return 'default'
  }
}
