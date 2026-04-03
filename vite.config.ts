import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const flexToken = env.VITE_IBKR_FLEX_TOKEN ?? env.IBKR_FLEX_TOKEN ?? ''
  const flexQueryId = env.VITE_IBKR_FLEX_QUERY_ID ?? env.IBKR_FLEX_QUERY_ID ?? ''
  const flexFixture = env.VITE_IBKR_FLEX_FIXTURE_URL ?? ''

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_IBKR_FLEX_TOKEN': JSON.stringify(flexToken),
      'import.meta.env.VITE_IBKR_FLEX_QUERY_ID': JSON.stringify(flexQueryId),
      'import.meta.env.VITE_IBKR_FLEX_FIXTURE_URL': JSON.stringify(flexFixture),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        }, // dalali-api: npm run server:dev (api/)
        // IB Flex Web Service — modern path (see IBKR Flex Web Service docs / AccountManagement/FlexWebService)
        '/ibkr-flex': {
          target: 'https://ndcdyn.interactivebrokers.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/ibkr-flex/, '/AccountManagement/FlexWebService'),
        },
        '/stooq-proxy': {
          target: 'https://stooq.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/stooq-proxy/, ''),
        },
      },
    },
  }
})
