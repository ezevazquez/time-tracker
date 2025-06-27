export const PERSON_STATUS = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  TERMINATED: 'Terminated',
} as const

export const PERSON_TYPE = {
  INTERNAL: 'Internal',
  EXTERNAL: 'External',
} as const

export const PERSON_STATUS_OPTIONS = [
  { label: 'Activo', value: PERSON_STATUS.ACTIVE },
  { label: 'Pausado', value: PERSON_STATUS.PAUSED },
  { label: 'Terminado', value: PERSON_STATUS.TERMINATED },
]

export const PERSON_TYPE_OPTIONS = [
  { label: 'Interno', value: PERSON_TYPE.INTERNAL },
  { label: 'Externo', value: PERSON_TYPE.EXTERNAL },
]

export const ACTIVE_PERSON_STATUSES = [
  PERSON_STATUS.ACTIVE,
  PERSON_STATUS.PAUSED,
] as const

export const INACTIVE_PERSON_STATUSES = [
  PERSON_STATUS.TERMINATED,
] as const
