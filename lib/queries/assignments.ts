import { sanityClient } from "@/sanity/lib/client"

export async function getAssignments() {
  const query = `
    *[_type == "assignment"] {
      _id,
      startDate,
      endDate,
      hoursPerDay,
      startTime,
      endTime,
      notes,
      "person": person->{
        _id,
        name,
        surname,
        role,
        isFullTime,
        timezone,
        "avatar": avatar.asset->url
      },
      "project": project->{
        _id,
        name,
        client,
        colorIndex
      }
    }
  `
  return sanityClient.fetch(query, {}, { cache: 'no-store' })
}

export async function getAssignmentsByDateRange(startDate: string, endDate: string) {
  const query = `
    *[_type == "assignment" && 
      (startDate <= $endDate && endDate >= $startDate)] {
      _id,
      startDate,
      endDate,
      hoursPerDay,
      startTime,
      endTime,
      notes,
      "person": person->{
        _id,
        name,
        surname,
        role,
        isFullTime,
        timezone,
        "avatar": avatar.asset->url
      },
      "project": project->{
        _id,
        name,
        client,
        colorIndex
      }
    }
  `
  return sanityClient.fetch(query, { startDate, endDate }, { cache: 'no-store' })
}
