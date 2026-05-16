import { defineConfig, passthroughImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Ambil domain dari Env Variable saat build, atau gunakan default untuk lokal
const SITE_URL = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: SITE_URL, // Sekarang domain bersifat dinamis
  output: 'static', // Pastikan tetap static
  build: {
    inlineStylesheets: 'always',
  },
  image: {
    service: passthroughImageService(),
    domains: ['jlkuxbwuuhxtaguqfskz.supabase.co', 'localhost'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  i18n: {
    defaultLocale: process.env.PUBLIC_TENANT_REGION === 'MY' ? 'my' : 'id',
    locales: process.env.PUBLIC_TENANT_REGION === 'MY' ? ['my', 'en'] : ['id', 'en', 'my'],
    routing: {
      prefixDefaultLocale: false,
    }
  }
});
