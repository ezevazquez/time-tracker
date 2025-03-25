export interface Person {
  _id: string
  name: string
  surname: string
  role: string
  isFullTime: boolean
  timezone?: string
  avatar?: string
}

export interface Project {
  _id: string
  name: string
  client: string
  startDate: string
  endDate: string
  colorIndex: number
}

export interface Assignment {
  _id: string
  person: Person
  project: Project
  startDate: string
  endDate: string
  hoursPerDay?: number
  startTime?: string
  endTime?: string
  notes?: string
}

export interface DateRange {
  startDate: Date
  endDate: Date
}

