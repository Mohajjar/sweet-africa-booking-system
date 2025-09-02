export function getStatusClasses(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusColor(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "#facc15";
    case "confirmed":
      return "#60a5fa";
    case "completed":
      return "#4ade80";
    case "cancelled":
      return "#f87171";
    default:
      return "#9ca3af";
  }
}

export function getRoleBadge(role) {
  const r = String(role || "").toLowerCase();
  let classes = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  let roleName = "Unknown";

  switch (r) {
    case "cleaner":
      classes += " bg-green-100 text-green-800";
      roleName = "Cleaner";
      break;
    case "manager":
      classes += " bg-blue-100 text-blue-800";
      roleName = "Manager";
      break;
    case "owner":
      classes += " bg-purple-100 text-purple-800";
      roleName = "Owner";
      break;
    default:
      classes += " bg-gray-100 text-gray-800";
      break;
  }
  return `<span class="${classes}">${roleName}</span>`;
}
