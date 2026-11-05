import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { serveurMondes } from './serveur-mondes';

// L'atelier d'auteur : une page de développement, séparée du jeu vendu. Le plugin lit les mondes dans packages/mondes.
export default defineConfig({
  plugins: [react(), serveurMondes('../../packages/mondes')],
  server: { port: 5180, strictPort: true },
});
