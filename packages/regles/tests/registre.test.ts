import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOSSIERS_EDITABLES,
  idsDeLaBible,
  indexerReferences,
  prefixeProbable,
  problemeIdentifiant,
  promisMaisAbsents,
  proposerIdentifiant,
  registreIds,
  schemaDuDossier,
  versIdentifiant,
  type DonneesMonde,
} from '../src';
import { chargerMonde, listerMondes, listerMondesEcrits, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const MINI = join(import.meta.dirname, 'fixtures/mini-monde');
const HISTOIRES_PUBLIEES_EN_PROLOGUE = new Set(['marche-d-ombrefiel']);

function charger(dossier: string): DonneesMonde {
  const r = chargerMonde(dossier);
  if (!r.ok) throw new Error(r.erreurs.map((e) => `${e.fichier}: ${e.message}`).join('\n'));
  return r.monde;
}

describe('identifiants', () => {
  it('fabrique un identifiant kebab-case ASCII depuis un nom libre', () => {
    expect(versIdentifiant('Mère Sorel Quaibas')).toBe('mere-sorel-quaibas');
    expect(versIdentifiant("Frère Halvard d'Hautecôte")).toBe('frere-halvard-d-hautecote');
    expect(versIdentifiant('Cœur-de-Tourbe')).toBe('coeur-de-tourbe');
    expect(versIdentifiant('  Æther  ––  n° 7 !! ')).toBe('aether-n-7');
    expect(versIdentifiant('€€€')).toBe('');
  });

  it('dit pourquoi un identifiant est mauvais', () => {
    expect(problemeIdentifiant('mere-sorel')).toBeNull();
    expect(problemeIdentifiant('f-tanière')).toMatch(/accents/);
    expect(problemeIdentifiant('Port')).toMatch(/majuscules/);
    expect(problemeIdentifiant('a b')).toMatch(/espaces/);
    expect(problemeIdentifiant('-x')).toMatch(/tiret/);
    expect(problemeIdentifiant('')).toMatch(/vide/);
    expect(problemeIdentifiant('a_b')).toMatch(/seuls/);
  });

  it('propose un identifiant libre, avec le préfixe de zone et un numéro en cas de collision', () => {
    const pris = new Set(['por-hennequin', 'por-hennequin-2']);
    expect(proposerIdentifiant('Hennequin', new Set(), 'por-')).toBe('por-hennequin');
    expect(proposerIdentifiant('Hennequin', pris, 'por-')).toBe('por-hennequin-3');
    expect(proposerIdentifiant('€', new Set())).toBe('');
  });

  it('devine le préfixe de zone d’un dossier d’après ses identifiants', () => {
    expect(prefixeProbable(['cit-a', 'cit-b', 'cit-c', 'por-x', 'cit-d'])).toBe('cit-');
    expect(prefixeProbable(['alpha', 'beta', 'gamma', 'delta'])).toBeUndefined();
    expect(prefixeProbable(['cit-a', 'por-b'])).toBeUndefined();
  });

  it('lit les identifiants du registre d’une BIBLE (listes, tableaux, accents graves)', () => {
    const md = `# Bible\n\n## 6. Peuples\n\n- ne-pas-prendre\n\n## 7. Registre des identifiants fixes\n\n### Lieux\n\n- mireval — village\n  - mir-place-du-marche\n\n| id | Qui |\n|---|---|\n| anselme-roux | le meunier |\n| \`huguette\` | cheffe |\n\nFlags : \`pacte-revele\`, \`grenier-vide\`\n\n## 8. Suite\n\n- hors-section\n`;
    expect([...idsDeLaBible(md)].sort()).toEqual(['anselme-roux', 'grenier-vide', 'mir-place-du-marche', 'pacte-revele']);
    expect(idsDeLaBible('# rien').size).toBe(0);
  });

  it('les BIBLE des mondes livrés donnent des identifiants, et la plupart existent dans le monde', () => {
    for (const id of listerMondesEcrits()) {
      // Un monde en brouillon s'écrit zone par zone : son registre cite des ids de zones pas encore écrites.
      if (JSON.parse(readFileSync(join(RACINE_MONDES, id, 'monde.json'), 'utf8')).statut === 'brouillon') continue;
      // Publiés avant d'être complets : seule la zone 1 de La Marche d'Ombrefiel est écrite, son registre cite les zones 2 à 6. À retirer
      // de cette liste quand ces zones existent.
      if (HISTOIRES_PUBLIEES_EN_PROLOGUE.has(id)) continue;
      const bible = readFileSync(join(RACINE_MONDES, id, 'BIBLE.md'), 'utf8');
      const ids = idsDeLaBible(bible);
      expect(ids.size, id).toBeGreaterThan(20);
      const dm = charger(join(RACINE_MONDES, id));
      const absents = promisMaisAbsents(ids, dm, indexerReferences(dm));
      // Un registre peut citer quelques ids qui n'existent pas (renommés, abandonnés) : pas la majorité.
      expect(absents.length / ids.size, `${id} : ${absents.slice(0, 8).join(', ')}`).toBeLessThan(0.35);
    }
  });
});

describe('schémas par dossier', () => {
  it('chaque dossier éditable a un schéma qui accepte ses fiches réelles', () => {
    expect(DOSSIERS_EDITABLES).toEqual(expect.arrayContaining(['lieux', 'pnj', 'quetes', 'dilemmes', 'savoirs', 'codex']));
    expect(schemaDuDossier('scenes')).toBeUndefined();
    for (const dossier of ['lieux', 'pnj', 'quetes', 'fins', 'faits']) {
      const dm = charger(MINI);
      const schema = schemaDuDossier(dossier)!;
      const map = (dm as unknown as Record<string, Map<string, unknown>>)[dossier]!;
      for (const e of map.values()) expect(schema.safeParse(e).success, dossier).toBe(true);
    }
    expect(schemaDuDossier('lieux')!.safeParse({ id: 'Mauvais Id' }).success).toBe(false);
  });
});

describe('registre des identifiants', () => {
  it('compte qui produit et qui lit chaque entité, et liste ce qui est cité sans exister', () => {
    const dm = charger(MINI);
    dm.evenements.set('ev-x', { id: 'ev-x', declencheur: 'condition', unique: true, narration: 'x', condition: { fait: 'f-fantome' }, effets: [{ fait: 'f-loups' }, { quete: { id: 'q-loups', statut: 'active' } }] });
    const r = registreIds(dm, indexerReferences(dm), srd);
    expect(r.entites['lieux']!.map((l) => l.id)).toEqual(['auberge', 'grotte', 'sentier', 'village']);
    const loups = r.entites['faits']!.find((f) => f.id === 'f-loups')!;
    expect(loups.produit).toBeGreaterThanOrEqual(2); // révélé par Bertrand et par l'événement
    expect(r.entites['quetes']!.find((q) => q.id === 'q-loups')!.produit).toBeGreaterThan(0);
    expect(r.inconnus.find((x) => x.id === 'f-fantome')).toMatchObject({ genre: 'fait', sites: [{ entite: { type: 'evenements', id: 'ev-x' }, role: 'condition' }] });
    // Un objet du catalogue SRD n'est pas « inconnu ».
    expect(r.inconnus.some((x) => x.genre === 'objet' && srd.objets.has(x.id))).toBe(false);
  });

  it.each(listerMondesEcrits())('« %s » : aucune référence inconnue (le validateur le garantit déjà)', (id) => {
    const dm = charger(join(RACINE_MONDES, id));
    expect(registreIds(dm, indexerReferences(dm), srd).inconnus).toEqual([]);
  });
});
