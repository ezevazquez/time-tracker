import type { SchemaTypeDefinition } from "sanity"
import person from "./person"
import project from "./project"
import assignment from "./assignment"

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [person, project, assignment],
}

