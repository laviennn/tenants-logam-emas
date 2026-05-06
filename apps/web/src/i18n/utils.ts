import { ui, defaultLang, languages } from './ui';

export { languages };

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function localizePath(path: string, lang: string) {
  const prefix = lang === defaultLang ? '' : `/${lang}`;
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (lang === defaultLang) return cleanPath;
  return `${prefix}${cleanPath}`.replace(/\/+/g, '/');
}
