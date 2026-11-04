import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// `?effets` ouvre le banc d'essai des effets de combat (réglage des effets, sons et musiques), **en développement
// seulement** : `import.meta.env.DEV` vaut `false` dans le build de production, qui ne contient donc pas le banc.
const BancEffets = import.meta.env.DEV ? lazy(() => import('./composants/BancEffets').then((m) => ({ default: m.BancEffets }))) : null;
const banc = BancEffets && new URLSearchParams(window.location.search).has('effets');

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    {banc && BancEffets ? (
      <Suspense fallback={null}>
        <BancEffets />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
