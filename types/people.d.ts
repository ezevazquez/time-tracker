import { PERSON_STATUS, PERSON_TYPE } from '@/constants/people'

export interface Person {
    id: string
    name: string
    profile: string
    start_date: string
    end_date: string | null
    status: typeof PERSON_STATUS[keyof typeof PERSON_STATUS]
    type: typeof PERSON_TYPE[keyof typeof PERSON_TYPE]
    created_at: string
    updated_at: string
    first_name: string
    last_name: string
  }
  