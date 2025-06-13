const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (ajustar según tu configuración)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAssignmentValidation() {
  console.log('🧪 Probando validación de asignaciones...\n')

  try {
    // 1. Obtener algunas personas y proyectos de prueba
    console.log('1. Obteniendo datos de prueba...')
    
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, first_name, last_name, profile')
      .eq('status', 'Active')
      .limit(2)

    if (peopleError) throw peopleError

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'In Progress')
      .limit(2)

    if (projectsError) throw projectsError

    if (!people.length || !projects.length) {
      console.log('❌ No hay suficientes datos de prueba (personas o proyectos)')
      return
    }

    const person = people[0]
    const project = projects[0]

    console.log(`✅ Persona: ${person.first_name} ${person.last_name} (${person.profile})`)
    console.log(`✅ Proyecto: ${project.name}\n`)

    // 2. Probar validación sin asignaciones existentes
    console.log('2. Probando validación sin asignaciones existentes...')
    
    const testDate = new Date()
    const startDate = testDate.toISOString().split('T')[0]
    const endDate = new Date(testDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: validationResult, error: validationError } = await supabase.rpc(
      'check_assignment_overallocation',
      {
        _assignment_id: null,
        _person_id: person.id,
        _start_date: startDate,
        _end_date: endDate,
        _allocation: 0.5 // 50%
      }
    )

    if (validationError) throw validationError

    console.log(`✅ Resultado: ${validationResult.length} días con sobreasignación`)
    if (validationResult.length > 0) {
      console.log('   Días con sobreasignación:', validationResult)
    } else {
      console.log('   ✅ No hay sobreasignación')
    }
    console.log()

    // 3. Crear una asignación de prueba
    console.log('3. Creando asignación de prueba...')
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        person_id: person.id,
        project_id: project.id,
        start_date: startDate,
        end_date: endDate,
        allocation: 0.5,
        assigned_role: 'Test Role'
      })
      .select()
      .single()

    if (assignmentError) throw assignmentError

    console.log(`✅ Asignación creada con ID: ${assignment.id}\n`)

    // 4. Probar validación con asignación existente
    console.log('4. Probando validación con asignación existente...')
    
    const { data: validationWithExisting, error: validationWithExistingError } = await supabase.rpc(
      'check_assignment_overallocation',
      {
        _assignment_id: null, // simulando nueva asignación
        _person_id: person.id,
        _start_date: startDate,
        _end_date: endDate,
        _allocation: 0.6 // 60% - debería causar sobreasignación
      }
    )

    if (validationWithExistingError) throw validationWithExistingError

    console.log(`✅ Resultado: ${validationWithExisting.length} días con sobreasignación`)
    if (validationWithExisting.length > 0) {
      console.log('   Días con sobreasignación:', validationWithExisting)
      console.log('   ✅ Sobreasignación detectada correctamente')
    } else {
      console.log('   ❌ No se detectó sobreasignación esperada')
    }
    console.log()

    // 5. Probar validación excluyendo la asignación existente
    console.log('5. Probando validación excluyendo asignación existente...')
    
    const { data: validationExcluding, error: validationExcludingError } = await supabase.rpc(
      'check_assignment_overallocation',
      {
        _assignment_id: assignment.id, // excluyendo la asignación existente
        _person_id: person.id,
        _start_date: startDate,
        _end_date: endDate,
        _allocation: 0.6 // 60%
      }
    )

    if (validationExcludingError) throw validationExcludingError

    console.log(`✅ Resultado: ${validationExcluding.length} días con sobreasignación`)
    if (validationExcluding.length > 0) {
      console.log('   Días con sobreasignación:', validationExcluding)
    } else {
      console.log('   ✅ No hay sobreasignación (excluyendo asignación existente)')
    }
    console.log()

    // 6. Limpiar datos de prueba
    console.log('6. Limpiando datos de prueba...')
    
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignment.id)

    if (deleteError) throw deleteError

    console.log('✅ Datos de prueba eliminados\n')

    console.log('🎉 Todas las pruebas completadas exitosamente!')

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message)
    console.error('Detalles:', error)
  }
}

// Ejecutar las pruebas si el script se ejecuta directamente
if (require.main === module) {
  testAssignmentValidation()
}

module.exports = { testAssignmentValidation } 