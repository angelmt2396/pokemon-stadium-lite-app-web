import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { battleEn } from '@/i18n/en/battle';
import { catalogEn } from '@/i18n/en/catalog';
import { commonEn } from '@/i18n/en/common';
import { homeEn } from '@/i18n/en/home';
import { loginEn } from '@/i18n/en/login';
import { matchmakingEn } from '@/i18n/en/matchmaking';
import { battleEs } from '@/i18n/es/battle';
import { catalogEs } from '@/i18n/es/catalog';
import { commonEs } from '@/i18n/es/common';
import { homeEs } from '@/i18n/es/home';
import { loginEs } from '@/i18n/es/login';
import { matchmakingEs } from '@/i18n/es/matchmaking';

const savedLanguage = localStorage.getItem('pokemon-stadium-lite-language') ?? 'es';

void i18n.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    es: {
      common: commonEs,
      home: homeEs,
      login: loginEs,
      catalog: catalogEs,
      matchmaking: matchmakingEs,
      battle: battleEs,
    },
    en: {
      common: commonEn,
      home: homeEn,
      login: loginEn,
      catalog: catalogEn,
      matchmaking: matchmakingEn,
      battle: battleEn,
    },
  },
});

export default i18n;
