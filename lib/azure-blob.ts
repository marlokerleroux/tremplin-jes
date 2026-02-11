import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob"

function getBlobServiceClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured")
  }
  return BlobServiceClient.fromConnectionString(connectionString)
}

function getContainerName() {
  return process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads"
}

export async function uploadBlob(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const blobServiceClient = getBlobServiceClient()
  const containerClient = blobServiceClient.getContainerClient(getContainerName())
  const blockBlobClient = containerClient.getBlockBlobClient(filename)

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  })

  return blockBlobClient.url
}

export async function deleteBlob(blobUrl: string): Promise<void> {
  try {
    const blobServiceClient = getBlobServiceClient()
    const containerClient = blobServiceClient.getContainerClient(getContainerName())

    // Extract blob name from URL
    const url = new URL(blobUrl)
    const pathParts = url.pathname.split("/")
    // URL format: /container/blobname
    const blobName = pathParts.slice(2).join("/")

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.deleteIfExists()
  } catch (error) {
    console.error("Error deleting blob:", error)
  }
}
