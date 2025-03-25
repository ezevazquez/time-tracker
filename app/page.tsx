import { Suspense } from "react"
import ClientRedirect from "@/components/ClientRedirect"

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ClientRedirect />
    </Suspense>
  )
}
