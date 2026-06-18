import { useEffect, useState } from 'react'
import { fetchAuthenticatedBlob, toApiPath } from '../../utils/authenticatedFile'

export default function AuthenticatedImage({ fileUrl, alt, style, className }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!fileUrl) {
      setSrc(null)
      return undefined
    }
    let cancelled = false
    fetchAuthenticatedBlob(toApiPath(fileUrl), { inline: true })
      .then(url => { if (!cancelled) setSrc(url) })
      .catch(() => { if (!cancelled) setSrc(null) })
    return () => { cancelled = true }
  }, [fileUrl])

  if (!src) return <div style={style} className={className} />
  return <img src={src} alt={alt} style={style} className={className} />
}
