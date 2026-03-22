import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const nextLanguage = i18n.language === 'es' ? 'en' : 'es';

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-xs uppercase tracking-[0.16em]"
      onClick={() => {
        void i18n.changeLanguage(nextLanguage);
        localStorage.setItem('pokemon-stadium-lite-language', nextLanguage);
      }}
    >
      {nextLanguage === 'en' ? 'EN' : 'ES'}
    </Button>
  );
}

