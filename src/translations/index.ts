
import ptTranslations from './pt';
import enTranslations from './en';

export type TranslationsMap = {
  pt: typeof ptTranslations;
  en: typeof enTranslations;
};

const translations: TranslationsMap = {
  pt: ptTranslations,
  en: enTranslations,
};

export default translations;
