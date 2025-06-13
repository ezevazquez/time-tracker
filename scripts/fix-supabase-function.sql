-- Script para verificar y corregir la función de validación de sobreasignaciones

-- Primero, vamos a verificar si la función existe
SELECT 
    routine_name, 
    routine_type, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'check_assignment_overallocation';

-- Si la función no existe o tiene problemas, aquí está la versión corregida:

CREATE OR REPLACE FUNCTION check_assignment_overallocation(
  _assignment_id uuid,
  _person_id uuid,
  _start_date date,
  _end_date date,
  _allocation double precision
)
RETURNS TABLE(overallocated_date date, total_allocation double precision)
LANGUAGE plpgsql
AS $$
DECLARE
  d date;
  current_total double precision;
BEGIN
  -- Iterar por cada día en el rango
  FOR d IN SELECT generate_series(_start_date, _end_date, interval '1 day')::date
  LOOP
    -- Calcular la asignación total para este día
    SELECT COALESCE(SUM(a.allocation), 0) + _allocation
    INTO current_total
    FROM assignments a
    WHERE a.person_id = _person_id
      AND a.id != COALESCE(_assignment_id, '00000000-0000-0000-0000-000000000000'::uuid)  -- exclude the assignment being updated
      AND d BETWEEN a.start_date AND a.end_date;
    
    -- Si la asignación total excede 1.0, retornar este día
    IF current_total > 1.0 THEN
      overallocated_date := d;
      total_allocation := current_total;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Función de prueba para verificar que funciona
CREATE OR REPLACE FUNCTION test_overallocation_function()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  test_person_id uuid;
  test_project_id uuid;
  test_date date := CURRENT_DATE;
  result record;
BEGIN
  -- Obtener una persona y proyecto de prueba
  SELECT id INTO test_person_id FROM people WHERE status = 'Active' LIMIT 1;
  SELECT id INTO test_project_id FROM projects WHERE status = 'In Progress' LIMIT 1;
  
  IF test_person_id IS NULL OR test_project_id IS NULL THEN
    RAISE NOTICE 'No hay datos de prueba disponibles';
    RETURN;
  END IF;
  
  -- Crear una asignación de prueba (75%)
  INSERT INTO assignments (person_id, project_id, start_date, end_date, allocation, assigned_role)
  VALUES (test_person_id, test_project_id, test_date, test_date, 0.75, 'Test Role');
  
  -- Probar la función con una nueva asignación del 50%
  RAISE NOTICE 'Probando función con 75%% + 50%% = 125%%...';
  
  FOR result IN 
    SELECT * FROM check_assignment_overallocation(
      NULL, 
      test_person_id, 
      test_date, 
      test_date, 
      0.5
    )
  LOOP
    RAISE NOTICE 'Sobreasignación detectada: % con total de %', 
      result.overallocated_date, 
      result.total_allocation;
  END LOOP;
  
  -- Limpiar
  DELETE FROM assignments WHERE person_id = test_person_id AND project_id = test_project_id AND assigned_role = 'Test Role';
  
  RAISE NOTICE 'Prueba completada';
END;
$$;

-- Ejecutar la prueba
SELECT test_overallocation_function(); 