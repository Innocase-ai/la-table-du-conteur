import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { relaisConteur } from './serveur-conteur';

export default defineConfig({
  // Le relais du conteur lit la clé dans le `.env` de la racine du dépôt (voir serveur-conteur.ts).
  plugins: [react(), relaisConteur('../..')],
  server: { port: 5173 },
});
