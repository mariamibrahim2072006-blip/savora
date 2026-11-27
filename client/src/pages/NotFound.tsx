import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="eyebrow">404</p>
      <h1 className="headline text-5xl md:text-7xl mt-6 mb-6">{t('notFound.title')}</h1>
      <p className="text-cream-50/50 max-w-md mb-10">{t('notFound.body')}</p>
      <Link to="/" className="btn-lux"><span>{t('notFound.cta')}</span></Link>
    </div>
  );
}
