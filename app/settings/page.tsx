'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectionStatus } from '@/components/connection-status'
import { Badge } from '@/components/ui/badge'
import { Database, Wifi, Settings, Edit, Trash2, Plus, Save, X } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { getProfiles, createProfile, updateProfile, deleteProfile, Profile } from '@/lib/services/profiles.service'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const supabaseConfigured = isSupabaseConfigured()

  // --- Perfiles ---
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [errorProfiles, setErrorProfiles] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<{ name: string; description: string }>({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    setErrorProfiles(null)
    try {
      const data = await getProfiles()
      setProfiles(data)
    } catch (e: any) {
      setErrorProfiles(e.message || 'Error al cargar perfiles')
    } finally {
      setLoadingProfiles(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setForm({ name: profile.name, description: profile.description || '' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar este perfil?')) return
    setSaving(true)
    try {
      await deleteProfile(id)
      fetchProfiles()
      if (editingProfile?.id === id) {
        setEditingProfile(null)
        setForm({ name: '', description: '' })
      }
    } catch (e) {
      alert('Error al eliminar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, { name: form.name, description: form.description })
        setEditingProfile(null)
      } else {
        await createProfile({ name: form.name, description: form.description })
      }
      setForm({ name: '', description: '' })
      fetchProfiles()
    } catch (e) {
      alert('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingProfile(null)
    setForm({ name: '', description: '' })
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your application configuration and database connection
        </p>
      </div>

      <div className="grid gap-6">
        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Database Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Data Source</h3>
                <p className="text-sm text-gray-500">
                  Current data source being used by the application
                </p>
              </div>
              <Badge variant="outline" className="flex items-center space-x-1">
                {supabaseConfigured ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Supabase Database</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    <span>Mock Data</span>
                  </>
                )}
              </Badge>
            </div>

            {/* Connection Status Component */}
            <ConnectionStatus />

            {!supabaseConfigured && (
              <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Using Mock Data</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        The application is currently using mock data. To connect to your Supabase
                        database, please configure the following environment variables:
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">
                            NEXT_PUBLIC_SUPABASE_URL
                          </code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">
                            NEXT_PUBLIC_SUPABASE_ANON_KEY
                          </code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">DB_URL</code>
                        </li>
                        <li>
                          <code className="bg-yellow-100 px-1 rounded">API_KEY</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    NEXT_PUBLIC_SUPABASE_URL
                  </label>
                  <div className="mt-1 text-sm text-gray-500">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </label>
                  <div className="mt-1 text-sm text-gray-500">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Sección de Perfiles --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span>Perfiles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-2 mb-4">
              <Input
                placeholder="Nombre del perfil"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="max-w-xs"
              />
              <Input
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="max-w-xs"
              />
              <Button type="submit" disabled={saving || !form.name} className="flex gap-1 items-center">
                <Save className="w-4 h-4" /> {editingProfile ? 'Actualizar' : 'Agregar'}
              </Button>
              {editingProfile && (
                <Button type="button" variant="outline" onClick={handleCancel} className="flex gap-1 items-center">
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              )}
            </form>
            {loadingProfiles ? (
              <div className="text-gray-500">Cargando perfiles...</div>
            ) : errorProfiles ? (
              <div className="text-red-500">{errorProfiles}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold">Nombre</th>
                      <th className="text-left px-3 py-2 font-semibold">Descripción</th>
                      <th className="text-right px-3 py-2 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(profile => (
                      <tr key={profile.id} className="border-t">
                        <td className="px-3 py-2">{profile.name}</td>
                        <td className="px-3 py-2 text-gray-500">{profile.description}</td>
                        <td className="px-3 py-2 text-right flex gap-2 justify-end">
                          <Button size="icon" variant="ghost" type="button" onClick={() => handleEdit(profile)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" type="button" onClick={() => handleDelete(profile.id)} disabled={saving}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
