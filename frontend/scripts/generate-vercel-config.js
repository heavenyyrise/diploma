import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendUrl = (process.env.BACKEND_URL || 'https://YOUR-BACKEND.up.railway.app').replace(/\/$/, '')

const config = {
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
    {
      source: '/media/:path*',
      destination: `${backendUrl}/media/:path*`,
    },
    {
      source: '/((?!api/|media/).*)',
      destination: '/index.html',
    },
  ],
}

writeFileSync(resolve(__dirname, '..', 'vercel.json'), JSON.stringify(config, null, 2) + '\n')
console.log(`vercel.json generated (backend: ${backendUrl})`)
