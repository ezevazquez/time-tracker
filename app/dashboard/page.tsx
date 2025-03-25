import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/dashboard/header"
import { Timeline } from "@/components/dashboard/timeline/timeline"
import { getPeople } from "@/lib/queries/people"
import { getAssignments } from "@/lib/queries/assignments"

export default async function DashboardPage() {
  const people = await getPeople()
  const assignments = await getAssignments()

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Timeline initialPeople={people} initialAssignments={assignments} />
        </main>
      </div>
    </ProtectedRoute>
  )
}

