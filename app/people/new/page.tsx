'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/utils/classnames'
import { usePeople } from '@/hooks/use-people'
import {
  PERSON_STATUS_OPTIONS,
  PERSON_TYPE_OPTIONS,
} from '@/constants/people'
import { PERSON_STATUS, PERSON_TYPE } from '@/constants/people'
import { getProfiles, Profile } from '@/lib/services/profiles.service'


export default function NewPersonPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null)

  const router = useRouter()
  const { createPerson } = usePeople()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    first_name: string
    last_name: string
    profile: string
    start_date: Date | undefined
    end_date: Date | undefined
    status: typeof PERSON_STATUS[keyof typeof PERSON_STATUS]
    type: typeof PERSON_TYPE[keyof typeof PERSON_TYPE]
  }>({
    first_name: '',
    last_name: '',
    profile: '',
    start_date: new Date(),
    end_date: undefined,
    status: PERSON_STATUS.ACTIVE,
    type: PERSON_TYPE.INTERNAL,
  })

  useEffect(() => {
    setLoadingProfiles(true)
    getProfiles()
      .then(data => setProfiles(data))
      .catch(e => setErrorProfiles(e.message || 'Error al cargar perfiles'))
      .finally(() => setLoadingProfiles(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.start_date) {
      toast.error('La fecha de inicio es requerida')
      return
    }

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('El nombre y apellido son requeridos')
      return
    }

    setLoading(true)

    try {
      await createPerson({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        profile: formData.profile,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
        status: formData.status,
        type: formData.type,
      })

      toast.success('Persona creada correctamente')
      router.push('/people')
    } catch (error) {
      const errorMsg = (error instanceof Error && error.message) ? error.message : 'Error al crear la persona'
      toast.error(errorMsg)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/people">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Agregar Persona</h1>
            <p className="text-muted-foreground">Registra un nuevo colaborador en el sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Persona</CardTitle>
            <CardDescription>Completa los datos del colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Ej: Ana"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Ej: García"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile">Perfil/Rol *</Label>
                  <Select
                    value={formData.profile}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, profile: value })
                    }
                  >
                    <SelectTrigger data-test="profile-select">
                      <SelectValue placeholder={loadingProfiles ? 'Cargando perfiles...' : 'Selecciona un perfil'} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProfiles ? (
                        <div className="px-4 py-2 text-gray-500">Cargando...</div>
                      ) : errorProfiles ? (
                        <div className="px-4 py-2 text-red-500">{errorProfiles}</div>
                      ) : profiles.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No hay perfiles</div>
                      ) : (
                        profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.name}>
                            {profile.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.start_date && 'text-muted-foreground'
                        )}
                        data-test="start-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={date => setFormData({ ...formData, start_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.end_date && 'text-muted-foreground'
                        )}
                        data-test="end-date-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={date => setFormData({ ...formData, end_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: typeof formData.status) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger data-test="status-select">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSON_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: typeof formData.type) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger data-test="type-select">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSON_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild data-test="cancel-button">
                  <Link href="/people">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading} data-test="create-person-button">
                  {loading && <Save className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Persona
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
