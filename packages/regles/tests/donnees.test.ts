import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ZodTypeAny } from 'zod';
import { Objet } from '../src/monde/schemas';
import { Arme, Armure, ChoixCreation, Classe, Don, Espece, Historique, Monstre, Sort } from '../src/schemas';

const RACINE = join(import.meta.dirname, '../../donnees/srd');

const COLLECTIONS: Record<string, ZodTypeAny> = {
  classes: Classe,
  especes: Espece,
  historiques: Historique,
  dons: Don,
  armures: Armure,
  armes: Arme,
  monstres: Monstre,
  sorts: Sort,
  choix: ChoixCreation,
  objets: Objet,
};

describe('données SRD', () => {
  for (const [dossier, schema] of Object.entries(COLLECTIONS)) {
    const fichiers = readdirSync(join(RACINE, dossier)).filter((f) => f.endsWith('.json'));
    for (const fichier of fichiers) {
      it(`${dossier}/${fichier} respecte le schéma`, () => {
        const contenu: unknown = JSON.parse(readFileSync(join(RACINE, dossier, fichier), 'utf8'));
        const elements = Array.isArray(contenu) ? contenu : [contenu];
        for (const element of elements) {
          const resultat = schema.safeParse(element);
          expect(resultat.success, JSON.stringify(resultat.error?.issues, null, 2)).toBe(true);
        }
      });
    }
  }
});
