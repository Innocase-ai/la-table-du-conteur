import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { relaisIa } from './relais-ia';
import { serveurMondes } from './serveur-mondes';

// L'atelier d'auteur : une page de développement, séparée du jeu vendu. Le plugin lit les mondes dans packages/mondes ; le relais
// de l'assistant d'écriture lit la clé dans le .env du projet (deux dossiers plus haut), sans jamais l'envoyer au navigateur.
export default defineConfig({
  plugins: [react(), serveurMondes('../../packages/mondes'), relaisIa('../..')],
  server: { port: 5180, strictPort: true },
});
