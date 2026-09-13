/** Applique `fn` à chaque élément par lots concurrents (envois SMTP en parallèle limité). */
export async function mapInBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(fn))))
  }
  return results
}

export const EMAIL_BATCH_SIZE = 5
