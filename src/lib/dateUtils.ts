/**
 * Safe ISO Date string formatter (YYYY-MM-DD) that never throws on invalid/null dates
 */
export function formatSafeDate(dateInput?: any): string {
  if (!dateInput) {
    return new Date().toISOString().slice(0, 10);
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput).slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}
