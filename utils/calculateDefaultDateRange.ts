export function getDefaultDateRange() {
  const from = new Date()
  from.setDate(from.getDate() - 7)
  const to = new Date()
  to.setDate(to.getDate() + 30)
  return { from, to }
} 