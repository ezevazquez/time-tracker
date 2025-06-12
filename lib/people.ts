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

/**
 * Gets the full name of a person combining first_name and last_name
 */
export function getFullName(person: Person): string {
  return `${person.first_name} ${person.last_name}`.trim()
}

/**
 * Gets the initials from first_name and last_name
 */
export function getInitials(person: Person): string {
  const firstInitial = person.first_name.charAt(0).toUpperCase()
  const lastInitial = person.last_name.charAt(0).toUpperCase()
  return `${firstInitial}${lastInitial}`.slice(0, 2)
}

/**
 * Gets the display name (full name) for a person
 * This is the main function to use when displaying a person's name
 */
export function getDisplayName(person: Person): string {
  return getFullName(person)
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
