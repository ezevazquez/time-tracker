import { sanityClient } from "@/sanity/lib/client"

export async function getProjects() {
  const query = `
    *[_type == "project"] | order(startDate asc) {
      _id,
      name,
      client,
      startDate,
      endDate,
      colorIndex
    }
  `
  return sanityClient.fetch(query, {}, { cache: 'no-store' })
}

export async function getProject(id: string) {
  const query = `
    *[_type == "project" && _id == $id][0] {
      _id,
      name,
      client,
      startDate,
      endDate,
      colorIndex
    }
  `
  return sanityClient.fetch(query, { id }, { cache: 'no-store' })
}
