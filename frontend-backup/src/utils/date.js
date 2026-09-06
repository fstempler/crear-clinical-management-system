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

export function formatDate(value, fallback = "No informada") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function calculateAge(value) {
  if (!value) return null;

  const birthDate = new Date(`${value.slice(0, 10)}T12:00:00-03:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const todayParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).formatToParts(new Date());
  const part = (type) => Number(todayParts.find((item) => item.type === type)?.value);
  const year = part("year");
  const month = part("month");
  const day = part("day");
  let age = year - birthDate.getUTCFullYear();

  if (
    month < birthDate.getUTCMonth() + 1 ||
    (month === birthDate.getUTCMonth() + 1 && day < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}
