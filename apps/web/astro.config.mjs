import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Ambil domain dari Env Variable saat build, atau gunakan default untuk lokal
const SITE_URL = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: SITE_URL, // Sekarang domain bersifat dinamis
  output: 'static', // Pastikan tetap static
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  i18n: {
    defaultLocale: "id",
    locales: ["id", "en", "my"],
    routing: {
      prefixDefaultLocale: false,
    }
  }
});
