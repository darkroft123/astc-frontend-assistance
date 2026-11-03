/**
 * Retorna la fecha en formato YYYY-MM-DD usando la zona horaria local del navegador/dispositivo,
 * evitando el desfase de día que produce .toISOString() al convertir a UTC.
 */
export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Retorna el primer día del mes actual en formato YYYY-MM-DD en hora local.
 */
export function getFirstDayOfCurrentMonth(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatLocalDate(first);
}
