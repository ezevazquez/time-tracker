import type { Person } from '@/types/people'
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
  const firstName = person.first_name?.charAt(0) || ""
  const lastName = person.last_name?.charAt(0) || ""
  return (firstName + lastName).toUpperCase()
}

/**
 * Gets the display name (full name) for a person
 * This is the main function to use when displaying a person's name
 */
export function getDisplayName(person: Person): string {
  return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim()
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

/**
 * Get CSS classes for person status badge
 */
export function getPersonStatusBadge(status: string) {
  const variants = {
    Active: 'bg-green-100 text-green-800',
    Paused: 'bg-yellow-100 text-yellow-800',
    Terminated: 'bg-red-100 text-red-800',
  }
  return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
}

/**
 * Get CSS classes for person type badge
 */
export function getPersonTypeBadge(type: string) {
  const variants = {
    Internal: 'bg-blue-100 text-blue-800',
    External: 'bg-purple-100 text-purple-800',
  }
  return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'
}
