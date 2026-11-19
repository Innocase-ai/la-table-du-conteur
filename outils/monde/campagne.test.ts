// F5 (c) — la rubrique « Campagne » de `pnpm monde verifier` et la commande `pnpm monde campagne`. Un épisode qui n'émet ni ne lit d'écho n'a
// pas de rubrique (les trois histoires publiées sont dans ce cas) ; un épisode qui en parle est contrôlé face aux autres épisodes du dossier.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerMonde, RACINE_MONDES } from '../../packages/regles/src/monde/chargeur';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { COMMANDES } from './cli-aide';
import { rubriqueCampagne } from './verifier';

const charger = (id: string): DonneesMonde => {
  const r = chargerMonde(join(RACINE_MONDES, id));
  if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
  return r.monde;
};
const ID = 'dime-des-roseaux';
const dossier = join(RACINE_MONDES, ID);

describe('la rubrique « Campagne » du bilan de vérification', () => {
  it('la commande `campagne` existe', () => {
    expect(COMMANDES).toContain('campagne');
  });

  it('un épisode sans écho n’a pas de rubrique (les histoires publiées ne changent pas)', () => {
    for (const id of ['marche-d-ombrefiel', 'dime-des-roseaux', 'tombe-des-rois-serpents']) expect(rubriqueCampagne(id, join(RACINE_MONDES, id), charger(id))).toBeUndefined();
  });

  it('un écho émis que personne ne lit : avis, rien ne bloque', () => {
    const dm = charger(ID);
    dm.monde.campagne = { emet: [{ id: 'epi-test-orphelin', quand: { flag: 'x' }, phrase: 'Un écho.' }] };
    const r = rubriqueCampagne(ID, dossier, dm)!;
    expect(r.statut).toBe('avis');
    expect(r.details.join('\n')).toMatch(/epi-test-orphelin.*aucun épisode ne le lit/);
  });

  it('un écho lu que personne n’émet : échec (la publication est bloquée)', () => {
    const dm = charger(ID);
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length)!;
    pnj.sujets[0]!.condition = { campagne: 'epi-test-fantome' };
    const r = rubriqueCampagne(ID, dossier, dm)!;
    expect(r.statut).toBe('echec');
    expect(r.details.join('\n')).toMatch(/ERREUR.*epi-test-fantome.*aucun épisode/);
  });

  it('un écho émis ici et lu par un autre épisode du dossier est accepté (ici : le même épisode n’est pas « un autre »)', () => {
    const dm = charger(ID);
    dm.monde.campagne = { emet: [{ id: 'epi-test-ok', quand: { flag: 'x' }, phrase: 'Un écho.' }] };
    const pnj = [...dm.pnj.values()].find((p) => p.sujets.length)!;
    pnj.sujets[0]!.condition = { campagne: 'epi-test-ok' };
    // Lu seulement par son émetteur : avis (le carnet ne change pas en cours de partie), pas une erreur.
    const r = rubriqueCampagne(ID, dossier, dm)!;
    expect(r.statut).toBe('avis');
    expect(r.details.join('\n')).toMatch(/n'est émis que par cet épisode/);
  });
});
