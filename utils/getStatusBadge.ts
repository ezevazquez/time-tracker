export const getStatusBadge = (status?: string) => {
  const variants = {
    "In Progress": "bg-green-100 text-green-800",
    "On Hold": "bg-yellow-100 text-yellow-800",
    Finished: "bg-gray-100 text-gray-800",
    "Not Started": "bg-blue-100 text-blue-800",
  };

  if (!status) {
    return "bg-gray-100 text-gray-800"; // Default case if status is undefined
  }

  return (
    variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  );
};
