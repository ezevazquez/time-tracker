const getDuration = (startDate: string, endDate: string | null) => {
  if (!endDate) return "En curso";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  if (months > 0) {
    return `${months}m ${days}d`;
  }
  return `${days}d`;
};
