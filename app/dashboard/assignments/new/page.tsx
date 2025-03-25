import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/dashboard/header"
import { AssignmentForm } from "@/components/dashboard/assignments/assignment-form"
import { getPeople } from "@/lib/queries/people"
import { getProjects } from "@/lib/queries/projects"

export default async function NewAssignmentPage() {
  const people = await getPeople()
  const projects = await getProjects()

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold">Create New Assignment</h1>
            <AssignmentForm people={people} projects={projects} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

