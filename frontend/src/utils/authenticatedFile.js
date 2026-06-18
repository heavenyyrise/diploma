import api from '../api'

const blobCache = new Map()

export function toApiPath(fileUrl) {
  try {
    return new URL(fileUrl, window.location.origin).pathname.replace(/^\/api/, '') || fileUrl
  } catch {
    return fileUrl.replace(/^\/api/, '')
  }
}

export async function fetchAuthenticatedBlob(url, { inline = false } = {}) {
  const apiPath = toApiPath(url)
  const key = inline ? `${apiPath}?inline=1` : apiPath
  if (blobCache.has(key)) return blobCache.get(key)

  const fetchUrl = inline && !apiPath.includes('inline=') ? `${apiPath}?inline=1` : apiPath
  const { data } = await api.get(fetchUrl, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(data)
  blobCache.set(key, blobUrl)
  return blobUrl
}

export function revokeBlobUrl(url) {
  const apiPath = toApiPath(url)
  for (const [key, blobUrl] of blobCache.entries()) {
    if (key.startsWith(apiPath)) {
      URL.revokeObjectURL(blobUrl)
      blobCache.delete(key)
    }
  }
}

export async function downloadAuthenticatedFile(url, filename) {
  const { data } = await api.get(toApiPath(url), { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(blobUrl)
}
