import 'dotenv/config'
import { createClient } from 'redis'

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
