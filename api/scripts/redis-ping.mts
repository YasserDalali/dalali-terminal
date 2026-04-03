import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from 'redis'

const d = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(d, '../../.env') })
dotenv.config({ path: path.resolve(d, '../.env') })

void (async () => {
  const url = process.env.REDIS_URL
  if (!url) {
    console.error('REDIS_URL missing')
    process.exit(1)
  }
  const c = createClient({ url })
  c.on('error', (e) => console.error('[redis]', e))
  await c.connect()
  const pong = await c.ping()
  console.log('PING', pong)
  await c.quit()
})()
