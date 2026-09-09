/** URLs des documents servis par les routes authentifiées. */
export function technicalSheetUrl(applicationId: string): string {
  return `/api/documents/technical-sheet/${applicationId}`
}

export function parentalAuthorizationUrl(applicationId: string, memberIndex: number): string {
  return `/api/documents/parental-authorization/${applicationId}?member=${memberIndex}`
}
