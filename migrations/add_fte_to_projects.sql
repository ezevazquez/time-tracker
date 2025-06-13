-- Agregar columna FTE a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN fte double precision DEFAULT NULL;

-- Comentario para documentar la columna
COMMENT ON COLUMN public.projects.fte IS 'Total FTE requerido para el proyecto (opcional)'; 