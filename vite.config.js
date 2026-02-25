import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 部署到 GitHub Pages 时，把 base 改成你的仓库名，例如 '/amap-search/'
// 如果你用自定义域名，改回 '/' 即可
const base = process.env.GITHUB_PAGES ? '/amap-search/' : '/'

export default defineConfig({
  plugins: [vue()],
  base,
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
