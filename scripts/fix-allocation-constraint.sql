-- Script para arreglar la restricción de allocation en la tabla assignments
-- El problema es que la restricción actual permite hasta 100.0 pero estamos usando FTE (0.0-1.0)

-- Primero, eliminar la restricción existente
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_allocation_check;

-- Agregar la nueva restricción para FTE (0.0-1.0)
ALTER TABLE public.assignments ADD CONSTRAINT assignments_allocation_check 
CHECK (allocation >= 0.0::double precision AND allocation <= 1.0::double precision);

-- Verificar que la restricción se aplicó correctamente
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'assignments_allocation_check'; 