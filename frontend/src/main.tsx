import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ChessCoachAppReact } from './ChessCoachApp';
import './index.css';
import './styles/themes.css';
import i18n from './i18n/config';

// Loading fallback component that respects locale
const LoadingFallback = () => {
  // Use i18n.t() directly instead of useTranslation hook
  // since this renders before React context is available
  const loadingText = i18n.t('common:status.loading', { defaultValue: 'Loading...' });
  const direction = i18n.resolvedLanguage === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        color: 'var(--text-primary, #333)',
        direction: direction
      }}
    >
      {loadingText}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <ChessCoachAppReact />
    </Suspense>
  </React.StrictMode>
);