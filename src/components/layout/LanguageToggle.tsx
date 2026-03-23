import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/cn';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'es';

  const languages = [
    { code: 'es', label: 'Español', shortLabel: 'MX', flag: '🇲🇽' },
    { code: 'en', label: 'English', shortLabel: 'US', flag: '🇺🇸' },
  ] as const;

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
      {languages.map((language) => {
        const isActive = currentLanguage === language.code;

        return (
          <button
            key={language.code}
            type="button"
            aria-label={language.label}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition',
              isActive
                ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(16,24,40,0.18)]'
                : 'text-slate-600 hover:bg-white hover:text-ink',
            )}
            onClick={() => {
              if (isActive) {
                return;
              }

              void i18n.changeLanguage(language.code);
              localStorage.setItem('pokemon-stadium-lite-language', language.code);
            }}
          >
            <span className="text-sm leading-none" aria-hidden="true">
              {language.flag}
            </span>
            <span className="hidden sm:inline">{language.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
