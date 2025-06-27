export const PROJECT_STATUS = {
    IN_PROGRESS: 'In Progress',
    FINISHED: 'Finished',
    ON_HOLD: 'On Hold',
    NOT_STARTED: 'Not Started',
  } as const
  
  export const PROJECT_STATUS_OPTIONS = [
    { label: 'En progreso', value: PROJECT_STATUS.IN_PROGRESS },
    { label: 'Finalizado', value: PROJECT_STATUS.FINISHED },
    { label: 'En pausa', value: PROJECT_STATUS.ON_HOLD },
    { label: 'No iniciado', value: PROJECT_STATUS.NOT_STARTED },
  ]
  
  export const ACTIVE_PROJECT_STATUSES = [
    PROJECT_STATUS.IN_PROGRESS,
    PROJECT_STATUS.ON_HOLD,
  ] as const
  
  export const INACTIVE_PROJECT_STATUSES = [
    PROJECT_STATUS.FINISHED,
    PROJECT_STATUS.NOT_STARTED,
  ] as const
  
  export const PROJECT_CONTRACT_TYPE = {
    RETAINER: 'Retainers',
    FIX_TIME: 'Fix time',
    TM: 'TyM',
  } as const
  
  export const PROJECT_CONTRACT_TYPE_OPTIONS = [
    { label: 'Retainer', value: PROJECT_CONTRACT_TYPE.RETAINER },
    { label: 'FP-FT', value: PROJECT_CONTRACT_TYPE.FIX_TIME },
    { label: 'T&M', value: PROJECT_CONTRACT_TYPE.TM },
  ]
  