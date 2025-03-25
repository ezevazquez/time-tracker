import { sanityClient } from "@/sanity/lib/client"

export async function getPeople() {
  const query = `
    *[_type == "person"] | order(name asc) {
      _id,
      name,
      surname,
      role,
      isFullTime,
      timezone,
      "avatar": avatar.asset->url
    }
  `
  return sanityClient.fetch(query, {}, { cache: 'no-store' })
}

export async function getPerson(id: string) {
  const query = `
    *[_type == "person" && _id == $id][0] {
      _id,
      name,
      surname,
      role,
      isFullTime,
      timezone,
      "avatar": avatar.asset->url
    }
  `
  return sanityClient.fetch(query, { id }, { cache: 'no-store' })
}
