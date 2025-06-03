"use client"

import { Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DataSourceNotice() {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-blue-800">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">
            Usando datos de demostración. Para conectar con Supabase, configura las variables de entorno
            correspondientes.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
