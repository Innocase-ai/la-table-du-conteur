// Module Conteur : ce que le conteur (IA) laisse dans le journal de la partie. Le joueur écrit librement (`saisie`), le
// conteur raconte (`raconter`) ; tout le reste de ce qu'il fait passe par les commandes des autres modules, que le moteur
// vérifie et exécute. Voir `conteur/` pour la boucle de tour.
import { z } from 'zod';
import { commande, type Module } from '../noyau/types';

declare module '../noyau/types' {
  interface CarteEvenements {
    saisieJoueur: { texte: string };
    recitConteur: { texte: string };
  }
}

export const moduleConteur: Module = {
  id: 'conteur',
  commandes: {
    saisie: commande({
      description: 'Le joueur écrit librement ce que fait le groupe (consigné au journal).',
      entree: z.object({ texte: z.string().trim().min(1).max(1000) }),
      executer: (t, e) => {
        t.emettre({ type: 'saisieJoueur', texte: e.texte });
      },
    }),
    raconter: commande({
      description: 'Consigne le récit du conteur au journal.',
      entree: z.object({ texte: z.string().trim().min(1).max(4000) }),
      executer: (t, e) => {
        t.emettre({ type: 'recitConteur', texte: e.texte });
      },
    }),
  },
};
