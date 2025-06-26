export default function calculateMonths(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()
  const days = endDate.getDate() - startDate.getDate()
  let totalMonths = years * 12 + months + days / 30.44
  return Math.round(totalMonths * 10) / 10
} 