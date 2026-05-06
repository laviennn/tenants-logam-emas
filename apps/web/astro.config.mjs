import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.logam-muliagold-antam.com',
  output: process.env.NODE_ENV === 'development' ? 'server' : 'static',
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
