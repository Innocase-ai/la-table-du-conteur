// Les données SRD construites à partir de fichiers déjà lus (navigateur : `import.meta.glob` de Vite ; atelier et jeu).
// Chaque fichier est un objet ou un tableau JSON ; les clés sont des chemins qui contiennent `/srd/<dossier>/`.
import type { z, ZodTypeAny } from 'zod';
import { indexer, type Donnees } from './donnees';
import { Objet } from './monde/schemas';
import { Arme, Armure, ChoixCreation, Classe, Don, Espece, Historique, Monstre, Sort } from './schemas';

function lire<S extends ZodTypeAny>(fichiers: Record<string, unknown>, dossier: string, schema: S): z.output<S>[] {
  return Object.entries(fichiers)
    .filter(([chemin]) => chemin.includes(`/srd/${dossier}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([chemin, contenu]) =>
      (Array.isArray(contenu) ? contenu : [contenu]).map((e): z.output<S> => {
        const r = schema.safeParse(e);
        if (!r.success) throw new Error(`${chemin} : ${r.error.message}`);
        return r.data;
      }),
    );
}

export function donneesDepuisFichiers(fichiers: Record<string, unknown>): Donnees {
  return {
    classes: indexer(lire(fichiers, 'classes', Classe)),
    especes: indexer(lire(fichiers, 'especes', Espece)),
    historiques: indexer(lire(fichiers, 'historiques', Historique)),
    dons: indexer(lire(fichiers, 'dons', Don)),
    armures: indexer(lire(fichiers, 'armures', Armure)),
    armes: indexer(lire(fichiers, 'armes', Arme)),
    monstres: indexer(lire(fichiers, 'monstres', Monstre)),
    sorts: indexer(lire(fichiers, 'sorts', Sort)),
    choix: indexer(lire(fichiers, 'choix', ChoixCreation)),
    objets: indexer(lire(fichiers, 'objets', Objet)),
  };
}
