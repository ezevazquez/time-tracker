-- Script para probar la función check_assignment_overallocation

-- 1. Primero, vamos a ver qué asignaciones existen para una persona específica
-- (reemplaza 'PERSON_ID_AQUI' con el ID real de una persona)
SELECT 
    a.id,
    a.person_id,
    a.project_id,
    a.start_date,
    a.end_date,
    a.allocation,
    p.name as project_name,
    pe.first_name || ' ' || pe.last_name as person_name
FROM assignments a
JOIN projects p ON a.project_id = p.id
JOIN people pe ON a.person_id = pe.id
WHERE a.person_id = 'PERSON_ID_AQUI'  -- Reemplaza con un ID real
ORDER BY a.start_date;

-- 2. Probar la función con datos específicos
-- (reemplaza los valores con datos reales de tu base de datos)
SELECT * FROM check_assignment_overallocation(
    NULL,  -- assignment_id (NULL para nueva asignación)
    'PERSON_ID_AQUI',  -- person_id (reemplaza con ID real)
    '2024-01-15',  -- start_date (reemplaza con fecha real)
    '2024-01-15',  -- end_date (reemplaza con fecha real)
    0.75  -- allocation (0.75 = 75%)
);

-- 3. Verificar manualmente el cálculo para una fecha específica
-- (esto nos ayudará a entender si la función está calculando correctamente)
SELECT 
    d.date,
    COALESCE(SUM(a.allocation), 0) as existing_allocation,
    0.75 as new_allocation,
    COALESCE(SUM(a.allocation), 0) + 0.75 as total_allocation,
    CASE 
        WHEN COALESCE(SUM(a.allocation), 0) + 0.75 > 1.0 
        THEN 'SOBREASIGNACIÓN' 
        ELSE 'OK' 
    END as status
FROM generate_series('2024-01-15'::date, '2024-01-15'::date, interval '1 day')::date d
LEFT JOIN assignments a ON 
    a.person_id = 'PERSON_ID_AQUI'  -- Reemplaza con ID real
    AND d.date BETWEEN a.start_date AND a.end_date
GROUP BY d.date
ORDER BY d.date;

-- 4. Verificar que la función existe y su definición
SELECT 
    routine_name, 
    routine_type, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'check_assignment_overallocation'; 