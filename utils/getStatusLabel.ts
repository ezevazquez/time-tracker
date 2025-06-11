export const getStatusLabel = (status?: string) => {
  const labels = {
    'In Progress': 'En Progreso',
    'On Hold': 'En Pausa',
    Finished: 'Finalizado',
    'Not Started': 'No Iniciado',
  }

  return labels[status as keyof typeof labels] || status
}
