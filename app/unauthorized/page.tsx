export default function UnauthorizedPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>Your Google account is not authorized.</p>
      </div>
    </main>
  )
}
