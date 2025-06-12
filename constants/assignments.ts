export const ASSIGNMENT_ALLOCATION_VALUES = [0.25, 0.5, 0.75, 1] as const

export const ASSIGNMENT_ALLOCATION_OPTIONS = ASSIGNMENT_ALLOCATION_VALUES.map(value => ({
  value,
  label: `${value * 100}%`,
}))

export const ASSIGNMENT_STATUS_VALUES = ['active', 'ended'] as const

