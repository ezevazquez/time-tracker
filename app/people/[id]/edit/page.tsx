'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { peopleService } from '@/lib/services/people.service'
import type { Person } from '@/types/people'
import {
  PERSON_STATUS_OPTIONS,
  PERSON_TYPE_OPTIONS,
  PERSON_STATUS,
  PERSON_TYPE,
} from '@/constants/people'
import { ResourceError } from '@/components/ui/resource-error'
import { getProfiles, Profile } from '@/lib/services/profiles.service'

const formSchema = z.object({
  first_name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  last_name: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  profile: z.string().min(2, { message: 'El perfil debe tener al menos 2 caracteres' }),
  start_date: z.date({ required_error: 'La fecha de inicio es requerida' }),
  end_date: z.date().nullable().optional(),
  status: z.enum([PERSON_STATUS.ACTIVE, PERSON_STATUS.PAUSED, PERSON_STATUS.TERMINATED], {
    required_error: 'El estado es requerido',
  }),
  type: z.enum([PERSON_TYPE.INTERNAL, PERSON_TYPE.EXTERNAL], {
    required_error: 'El tipo es requerido',
  }),
})

export default function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const backHref = from === 'show' ? `/people/${id}/show` : '/people'
  const [isLoading, setIsLoading] = useState(false)
  const [person, setPerson] = useState<Person | null>(null)
  const [isLoadingPerson, setIsLoadingPerson] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      profile: '',
      start_date: new Date(),
      end_date: null,
      status: PERSON_STATUS.ACTIVE,
      type: PERSON_TYPE.INTERNAL,
    },
  })

  // Fetch person data
  useEffect(() => {
    async function fetchPerson() {
      try {
        setIsLoadingPerson(true)
        const personData = await peopleService.getById(id)
        if (personData) {
          setPerson(personData)
          // Set form values
          form.reset({
            first_name: personData.first_name,
            last_name: personData.last_name,
            profile: personData.profile,
            start_date: personData.start_date ? new Date(personData.start_date) : new Date(),
            end_date: personData.end_date ? new Date(personData.end_date) : null,
            status: personData.status,
            type: personData.type,
          })
        } else {
          setError('Persona no encontrada')
        }
      } catch (err) {
        console.error('Error fetching person:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar la persona')
      } finally {
        setIsLoadingPerson(false)
      }
    }

    fetchPerson()
  }, [id, form])

  useEffect(() => {
    setLoadingProfiles(true)
    getProfiles()
      .then(data => setProfiles(data))
      .catch(e => setErrorProfiles(e.message || 'Error al cargar perfiles'))
      .finally(() => setLoadingProfiles(false))
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      await peopleService.update(id, {
        ...values,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date ? values.end_date.toISOString() : null,
      })
      toast.success('Persona actualizada correctamente')
      router.push('/people')
    } catch (error) {
      console.error('Error updating person:', error)
      toast.error('Error al actualizar la persona')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingPerson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos de la persona...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <ResourceError error={error} resourceName="Persona" resourcePath="/people" />
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" asChild data-test="back-button">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold" data-test="edit-person-title">Editar Persona</h1>
        </div>
        <p className="text-muted-foreground">Actualiza los datos de la persona</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle data-test="person-info-title">Datos de la Persona</CardTitle>
          <CardDescription>Completa los campos para actualizar la persona</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} data-test="person-name-input"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido" {...field} data-test="person-lastname-input"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger data-test="person-profile-select">
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              data-test="person-start-date-button"
                            >
                              {field.value
                                ? format(field.value, 'dd/MM/yyyy')
                                : 'Seleccionar fecha'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Fin</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              data-test="person-end-date-button"
                            >
                              {field.value
                                ? format(field.value, 'dd/MM/yyyy')
                                : 'Seleccionar fecha'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-test="person-status-select">
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PERSON_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-test="person-type-select">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PERSON_TYPE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push('/people')} data-test="cancel-button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} data-test="update-person-button">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar Persona
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
