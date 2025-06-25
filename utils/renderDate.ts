export const renderDate = (dateStr?: string): string => {
  if (!dateStr) return "";

  const hasTime = /T\d{2}:\d{2}(:\d{2})?/.test(dateStr);
  const safeDateStr = hasTime ? dateStr : `${dateStr}T00:00:00`;

  const localDate = new Date(safeDateStr);
  return localDate.toLocaleDateString("es-ES");
};