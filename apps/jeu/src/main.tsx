import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { BancEffets } from './composants/BancEffets';
import './styles.css';

// `?effets` ouvre le banc d'essai des effets de combat (réglage visuel), sans lancer de partie.
const banc = new URLSearchParams(window.location.search).has('effets');

createRoot(document.getElementById('racine')!).render(<StrictMode>{banc ? <BancEffets /> : <App />}</StrictMode>);
