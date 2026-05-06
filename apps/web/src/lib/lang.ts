import { persistentAtom } from '@nanostores/persistent';

export type Language = 'id' | 'en' | 'my';

export const langStore = persistentAtom<Language>('language', 'id');
