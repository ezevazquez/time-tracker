# Validación de Sobreasignaciones en Asignaciones

## Descripción

Este sistema implementa una validación robusta para evitar sobreasignaciones de personas a proyectos. La funcionalidad utiliza una función de Supabase que verifica la capacidad de asignación día por día, asegurando que ninguna persona exceda el 100% de su capacidad de trabajo.

## Conceptos Clave

### FTE (Full Time Equivalent)
- **1 FTE = 1 mes de trabajo de una persona**
- Una asignación del 50% significa que la persona trabaja part-time
- Una asignación del 100% significa que la persona trabaja full-time

### Sobreasignación
- Se produce cuando una persona tiene asignaciones que suman más del 100% en un mismo día
- El sistema detecta automáticamente estos casos y muestra advertencias

## Componentes Implementados

### 1. Función de Supabase
```sql
create or replace function check_assignment_overallocation(
  _assignment_id uuid,
  _person_id uuid,
  _start_date date,
  _end_date date,
  _allocation double precision
)
returns table(overallocated_date date, total_allocation double precision)
```

Esta función:
- Verifica cada día del rango de fechas
- Calcula la asignación total para cada día
- Retorna los días donde se excede el 100%

### 2. Hook de Validación (`useAssignmentValidation`)
- Maneja la validación en tiempo real
- Proporciona mensajes de error descriptivos
- Gestiona el estado de validación

### 3. Componente de Advertencia (`OverallocationWarning`)
- Muestra advertencias visuales claras
- Indica días específicos con sobreasignación
- Permite confirmar o cancelar la operación

### 4. Componente de Resumen (`AssignmentSummary`)
- Muestra información completa de la asignación
- Calcula y muestra el FTE
- Indica el estado de sobreasignación

## Flujo de Validación

1. **Entrada de Datos**: El usuario completa el formulario de asignación
2. **Validación en Tiempo Real**: El sistema valida automáticamente cuando cambian los datos
3. **Detección de Sobreasignación**: Se ejecuta la función de Supabase
4. **Visualización de Resultados**: Se muestran advertencias si es necesario
5. **Confirmación**: El usuario puede continuar o cancelar

## Uso

### Crear Nueva Asignación
```typescript
const { validateAssignment, getOverallocationMessage } = useAssignmentValidation()

const result = await validateAssignment(
  null, // ID de asignación (null para nueva)
  personId,
  startDate,
  endDate,
  allocation // en decimal (0.5 = 50%)
)
```

### Editar Asignación Existente
```typescript
const result = await validateAssignment(
  assignmentId, // ID de la asignación existente
  personId,
  startDate,
  endDate,
  allocation
)
```

## Mensajes de Error

El sistema proporciona mensajes específicos:
- **Un día**: "Sobreasignación del 120% el 15/01/2024"
- **Múltiples días**: "Sobreasignación del 120% en 5 días del período"

## Configuración

### Valores de Asignación Permitidos
- 25% (0.25)
- 50% (0.5)
- 75% (0.75)
- 100% (1.0)

### Estados de Personas Válidos
- Active
- Paused

## Beneficios

1. **Prevención de Errores**: Evita asignaciones inviables
2. **Transparencia**: Muestra claramente el impacto de cada asignación
3. **Flexibilidad**: Permite sobreasignaciones con confirmación
4. **Cálculo de FTE**: Automatiza el cálculo de equivalentes de tiempo completo
5. **Validación en Tiempo Real**: Feedback inmediato al usuario

## Consideraciones Técnicas

- La validación se ejecuta en el cliente y en el servidor
- Se excluye la asignación actual en ediciones
- Los cálculos consideran días completos (no horas específicas)
- El sistema maneja múltiples asignaciones simultáneas 