import { put, del } from "@vercel/blob"

export async function uploadBlob(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await put(filename, data, {
    access: "public",
    contentType,
  })

  return blob.url
}

export async function deleteBlob(blobUrl: string): Promise<void> {
  try {
    await del(blobUrl)
  } catch (error) {
    console.error("Error deleting blob:", error)
  }
}
