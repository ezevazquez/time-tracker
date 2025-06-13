// Cargar variables de entorno desde .env.local manualmente
const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove quotes
          envVars[key.trim()] = value.trim()
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.log('⚠️ No se pudo cargar .env.local:', error.message)
    return {}
  }
}

// Cargar variables de entorno
const envVars = loadEnvFile('.env.local')
Object.assign(process.env, envVars)

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase - usando exactamente la misma lógica que la app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DB_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  console.error('Necesitas configurar en .env.local:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL o DB_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY o API_KEY')
  process.exit(1)
}

console.log('🔧 Configuración Supabase:')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante')
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante')
console.log()

// Crear cliente con la misma configuración que la app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
})

async function testSimple() {
  console.log('🧪 Prueba simple de la función check_assignment_overallocation\n')

  try {
    // 1. Obtener una persona y proyecto
    console.log('1. Obteniendo datos...')
    
    // Usar exactamente la misma consulta que el servicio de personas
    console.log('🔍 Consultando tabla people (igual que peopleService.getAll())...')
    const { data: allPeople, error: allPeopleError } = await supabase
      .from('people')
      .select('*')
      .order('first_name')

    console.log('📊 People query result:', { 
      data: allPeople, 
      error: allPeopleError,
      dataLength: allPeople?.length 
    })
    
    if (allPeopleError) {
      console.error('❌ Error al consultar people:', allPeopleError)
      throw allPeopleError
    }
    
    console.log('👥 Datos en tabla people:')
    if (!allPeople || allPeople.length === 0) {
      console.log('   ❌ No hay personas en la base de datos')
      return
    }
    
    allPeople.slice(0, 5).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.first_name} ${person.last_name} - Status: "${person.status}" - Profile: "${person.profile}"`)
    })
    console.log(`   ... y ${allPeople.length - 5} personas más`)
    console.log()

    // Usar exactamente la misma consulta que el servicio de proyectos
    console.log('🔍 Consultando tabla projects...')
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('*')

    console.log('📊 Projects query result:', { 
      data: allProjects, 
      error: allProjectsError,
      dataLength: allProjects?.length 
    })
    
    if (allProjectsError) {
      console.error('❌ Error al consultar projects:', allProjectsError)
      throw allProjectsError
    }
    
    console.log('📋 Datos en tabla projects:')
    if (!allProjects || allProjects.length === 0) {
      console.log('   ❌ No hay proyectos en la base de datos')
      return
    }
    
    allProjects.slice(0, 5).forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} - Status: "${project.status}"`)
    })
    console.log(`   ... y ${allProjects.length - 5} proyectos más`)
    console.log()

    // Usar la primera persona disponible
    const person = allPeople[0]
    const project1 = allProjects[0]
    const project2 = allProjects[1] || allProjects[0]

    console.log(`✅ Usando persona: ${person.first_name} ${person.last_name} (${person.status})`)
    console.log(`✅ Usando proyecto 1: ${project1.name} (${project1.status})`)
    console.log(`✅ Usando proyecto 2: ${project2.name} (${project2.status})`)
    console.log()

    // 2. Fecha de prueba (hoy)
    const testDate = new Date()
    const dateStr = testDate.toISOString().split('T')[0]
    console.log(`📅 Fecha de prueba: ${dateStr}\n`)

    // 3. Crear primera asignación (75%)
    console.log('2. Creando primera asignación (75%)...')
    
    const { data: assignment1, error: assignment1Error } = await supabase
      .from('assignments')
      .insert({
        person_id: person.id,
        project_id: project1.id,
        start_date: dateStr,
        end_date: dateStr,
        allocation: 0.75,
        assigned_role: 'Test Role 1'
      })
      .select()
      .single()

    if (assignment1Error) throw assignment1Error
    console.log(`✅ Asignación 1 creada: ${assignment1.id}\n`)

    // 4. Probar validación para segunda asignación (50%)
    console.log('3. Probando validación para segunda asignación (50%)...')
    
    const { data: validationResult, error: validationError } = await supabase.rpc(
      'check_assignment_overallocation',
      {
        _assignment_id: null,
        _person_id: person.id,
        _start_date: dateStr,
        _end_date: dateStr,
        _allocation: 0.5
      }
    )

    if (validationError) throw validationError

    console.log('📊 Resultado de validación:')
    console.log('   - Días con sobreasignación:', validationResult.length)
    console.log('   - Datos:', validationResult)
    
    if (validationResult.length > 0) {
      console.log('✅ Sobreasignación detectada correctamente!')
      console.log('   Total de asignación:', validationResult[0].total_allocation)
      console.log('   Porcentaje:', Math.round(validationResult[0].total_allocation * 100) + '%')
    } else {
      console.log('❌ No se detectó sobreasignación (debería ser 125%)')
    }

    // 5. Limpiar
    console.log('\n4. Limpiando datos de prueba...')
    await supabase.from('assignments').delete().eq('id', assignment1.id)
    console.log('✅ Datos limpiados')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Detalles:', error)
  }
}

testSimple() 