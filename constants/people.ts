export const PERSON_STATUS = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  TERMINATED: 'Terminated',
} as const

export const PERSON_TYPE = {
  INTERNAL: 'Internal',
  EXTERNAL: 'External',
} as const

export const PERSON_PROFILE = {
  PROJECT_MANAGER: 'Project Manager',
  FRONTEND_DEVELOPER: 'Frontend Developer',
  BACKEND_DEVELOPER: 'Backend Developer',
  UX_DESIGNER: 'UX Designer',
  QA: 'QA',
} as const

export const PERSON_PROFILE_LABELS = {
  [PERSON_PROFILE.PROJECT_MANAGER]: 'PM',
  [PERSON_PROFILE.FRONTEND_DEVELOPER]: 'Front',
  [PERSON_PROFILE.BACKEND_DEVELOPER]: 'Back',
  [PERSON_PROFILE.UX_DESIGNER]: 'UX',
  [PERSON_PROFILE.QA]: 'QA',
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

export const PERSON_PROFILE_OPTIONS = [
  { label: 'Project Manager', value: PERSON_PROFILE.PROJECT_MANAGER },
  { label: 'Frontend Developer', value: PERSON_PROFILE.FRONTEND_DEVELOPER },
  { label: 'Backend Developer', value: PERSON_PROFILE.BACKEND_DEVELOPER },
  { label: 'UX Designer', value: PERSON_PROFILE.UX_DESIGNER },
  { label: 'QA', value: PERSON_PROFILE.QA },
]

export const ACTIVE_PERSON_STATUSES = [
  PERSON_STATUS.ACTIVE,
  PERSON_STATUS.PAUSED,
] as const

export const INACTIVE_PERSON_STATUSES = [
  PERSON_STATUS.TERMINATED,
] as const
