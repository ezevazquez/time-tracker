export interface TimelineFilters {
  personProfile: string
  projectStatus: string
  dateRange: { from: Date; to: Date | undefined }
  overallocatedOnly: boolean
  personType: string
  search: string
  projectId?: string
} 