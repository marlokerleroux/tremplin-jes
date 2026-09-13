/** URLs des documents imprimables de l'administration (fiches jury, ordre de passage). */
export function candidateSheetsUrl(filter: { id?: string; date?: string; status?: "validated" }): string {
  const params = new URLSearchParams()
  if (filter.id) params.set("id", filter.id)
  if (filter.date) params.set("date", filter.date)
  if (filter.status) params.set("status", filter.status)
  const query = params.toString()
  return `/admin/print/candidates${query ? `?${query}` : ""}`
}

export function runningOrderUrl(date: string): string {
  return `/admin/print/day?date=${encodeURIComponent(date)}`
}
