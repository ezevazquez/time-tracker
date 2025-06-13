-- Script de prueba para la nueva función check_assignment_overallocation

-- 1. Primero, vamos a ver qué personas y proyectos tenemos disponibles
SELECT 
    'Personas activas:' as info,
    COUNT(*) as count
FROM people 
WHERE status = 'Active';

SELECT 
    'Proyectos en progreso:' as info,
    COUNT(*) as count
FROM projects 
WHERE status = 'In Progress';

-- 2. Obtener una persona y proyecto de prueba
SELECT 
    'Persona de prueba:' as info,
    id as person_id,
    first_name || ' ' || last_name as name
FROM people 
WHERE status = 'Active' 
LIMIT 1;

SELECT 
    'Proyecto de prueba:' as info,
    id as project_id,
    name
FROM projects 
WHERE status = 'In Progress' 
LIMIT 1;

-- 3. Verificar asignaciones existentes para hoy
SELECT 
    'Asignaciones existentes para hoy:' as info,
    COUNT(*) as count,
    COALESCE(SUM(allocation), 0) as total_allocation
FROM assignments 
WHERE start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE;

-- 4. Probar la función con datos específicos
-- (reemplaza los UUIDs con los valores reales de tu base de datos)
SELECT 
    'Prueba 1: Sin asignaciones existentes, nueva asignación 75%' as test_case,
    * 
FROM check_assignment_overallocation(
    NULL,  -- assignment_id (NULL para nueva asignación)
    'REEMPLAZA_CON_PERSON_ID',  -- person_id (reemplaza con ID real)
    CURRENT_DATE,  -- start_date
    CURRENT_DATE,  -- end_date
    0.75  -- allocation (75%)
);

-- 5. Crear una asignación de prueba y luego probar
-- (ejecuta esto solo si quieres crear datos de prueba)
/*
INSERT INTO assignments (person_id, project_id, start_date, end_date, allocation, assigned_role)
VALUES (
    'REEMPLAZA_CON_PERSON_ID',  -- person_id
    'REEMPLAZA_CON_PROJECT_ID',  -- project_id
    CURRENT_DATE,  -- start_date
    CURRENT_DATE,  -- end_date
    0.75,  -- allocation (75%)
    'Test Role'
);
*/

-- 6. Probar la función después de crear la asignación
-- (ejecuta esto después del INSERT de arriba)
/*
SELECT 
    'Prueba 2: Con asignación existente de 75%, nueva asignación 50%' as test_case,
    * 
FROM check_assignment_overallocation(
    NULL,  -- assignment_id (NULL para nueva asignación)
    'REEMPLAZA_CON_PERSON_ID',  -- person_id (reemplaza con ID real)
    CURRENT_DATE,  -- start_date
    CURRENT_DATE,  -- end_date
    0.5  -- allocation (50% - debería detectar sobreasignación)
);
*/

-- 7. Limpiar datos de prueba (ejecuta esto al final)
/*
DELETE FROM assignments 
WHERE assigned_role = 'Test Role' 
    AND start_date = CURRENT_DATE;
*/ 