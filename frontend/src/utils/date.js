const TIME_ZONE = "America/Argentina/Buenos_Aires";
export function formatCurrentDate() {
  const value = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}
export function formatDateTime(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}
