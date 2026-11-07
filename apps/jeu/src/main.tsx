import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// `?effets` ouvre le banc d'essai des effets de combat (réglage des effets, sons et musiques), **en développement
// seulement** : `import.meta.env.DEV` vaut `false` dans le build de production, qui ne contient donc pas le banc.
const BancEffets = import.meta.env.DEV ? lazy(() => import('./composants/BancEffets').then((m) => ({ default: m.BancEffets }))) : null;
const banc = BancEffets && new URLSearchParams(window.location.search).has('effets');

// `?icones` : le banc d'essai des pictogrammes des cartes, de même en développement seulement.
const BancIcones = import.meta.env.DEV ? lazy(() => import('./composants/BancIcones').then((m) => ({ default: m.BancIcones }))) : null;
const bancIcones = BancIcones && new URLSearchParams(window.location.search).has('icones');

// `?pieges` : le banc d'essai de l'écran de désamorçage (chaque mécanisme, chaque issue), de même en développement seulement.
const BancPieges = import.meta.env.DEV ? lazy(() => import('./composants/BancPieges').then((m) => ({ default: m.BancPieges }))) : null;
const bancPieges = BancPieges && new URLSearchParams(window.location.search).has('pieges');

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    {bancPieges && BancPieges ? (
      <Suspense fallback={null}>
        <BancPieges />
      </Suspense>
    ) : bancIcones && BancIcones ? (
      <Suspense fallback={null}>
        <BancIcones />
      </Suspense>
    ) : banc && BancEffets ? (
      <Suspense fallback={null}>
        <BancEffets />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
