// `pnpm monde verifier` : le bilan d'une histoire en une commande. Les rubriques sont vérifiées sur un jeu d'essai (Port-Sillage) et sur des
// dossiers temporaires où l'on met ce qu'il faut : un secret qui fuit, une estimation périmée, un canon absent.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import { chargerMonde } from '../../packages/regles/src/monde/chargeur';
import { estimerCampagne } from '../../packages/regles/src/monde/estimation';
import { champsLibres } from '../../packages/regles/src/monde/revue';
import type { DonneesMonde } from '../../packages/regles/src/monde/schemas';
import { MONDES_ESSAI } from '../../packages/regles/tests/mondes-essai';
import { afficherBilan, completudeDuMonde, verifierMonde, type BilanVerification } from './verifier';

const srd = chargerDonneesSrd();
const dossierEssai = join(MONDES_ESSAI, 'port-sillage');
const r = chargerMonde(dossierEssai);
if (!r.ok) throw new Error('Port-Sillage illisible');
const dm: DonneesMonde = r.monde;

/** Un dossier de monde réduit à ce que la vérification lit en dehors des données : canon, estimation… */
function dossierTemporaire(fichiers: Record<string, unknown> = {}): string {
  const d = mkdtempSync(join(tmpdir(), 'verifier-'));
  mkdirSync(join(d, 'images'));
  for (const [nom, contenu] of Object.entries(fichiers)) writeFileSync(join(d, nom), JSON.stringify(contenu));
  return d;
}

const rubrique = (b: BilanVerification, nom: string) => b.rubriques.find((x) => x.nom === nom)!;

describe('pnpm monde verifier : les rubriques', () => {
  it('rend les cinq rubriques du bilan, dans l\'ordre, et saute le parcours à la demande', () => {
    const b = verifierMonde('port-sillage', dossierEssai, dm, srd, { parcours: false });
    expect(b.rubriques.map((x) => x.nom)).toEqual(['Validation', 'Complétude', 'Estimation', 'Revue de secrets', 'Parcours']);
    expect(rubrique(b, 'Parcours')).toMatchObject({ statut: 'saute' });
    // Port-Sillage a un canon.json : la revue a eu lieu et surveille ses secrets.
    expect(rubrique(b, 'Revue de secrets').resume).toMatch(/^secrets du canon : \d+ \(\d+ avec mots tabou\) ; /);
    expect(rubrique(b, 'Validation').resume).toMatch(/^0 erreur, \d+ avis$/);
  });

  it('une estimation absente ou périmée bloque un monde publié, et prévient seulement pour un brouillon', () => {
    const publie = dm.monde.statut === 'publie';
    expect(publie).toBe(true); // le jeu d'essai est déclaré publié
    const absente = verifierMonde('x', dossierTemporaire(), dm, srd, { parcours: false });
    expect(rubrique(absente, 'Estimation')).toMatchObject({ statut: 'echec', resume: 'estimation.json absent' });
    expect(absente.ok).toBe(false);

    const perimee = verifierMonde('x', dossierTemporaire({ 'estimation.json': { ...estimerCampagne(dm), tours: 1 } }), dm, srd, { parcours: false });
    expect(rubrique(perimee, 'Estimation').statut).toBe('echec');
    expect(rubrique(perimee, 'Estimation').resume).toMatch(/périmée/);

    const aJour = verifierMonde('x', dossierTemporaire({ 'estimation.json': estimerCampagne(dm) }), dm, srd, { parcours: false });
    expect(rubrique(aJour, 'Estimation')).toMatchObject({ statut: 'ok', resume: 'à jour' });

    // Un brouillon : seulement un avis.
    const brouillon: DonneesMonde = { ...dm, monde: { ...dm.monde, statut: 'brouillon' } };
    expect(rubrique(verifierMonde('x', dossierTemporaire(), brouillon, srd, { parcours: false }), 'Estimation').statut).toBe('avis');
  });

  it('sans canon.json, la revue n\'a pas eu lieu : un avis, jamais un silence', () => {
    const b = verifierMonde('x', dossierTemporaire(), dm, srd, { parcours: false });
    expect(rubrique(b, 'Revue de secrets')).toMatchObject({ statut: 'avis' });
    expect(rubrique(b, 'Revue de secrets').resume).toMatch(/pas de canon\.json/);
  });

  it('un mot tabou dans un texte libre est une FUITE : la publication est bloquée, sauf rejet de l\'auteur', () => {
    // Un mot d'un texte que le joueur lit (le premier champ libre du monde), déclaré tabou d'un secret sans fiche autorisée.
    const champ = champsLibres(dm).find((c) => /[a-zé]{7,}/i.test(c.texte))!;
    const mot = /[a-zéèêàç]{7,}/i.exec(champ.texte)![0];
    const canon = { secrets: [{ id: 'secret-essai', texte: 'x', motsTabou: [mot], autorise: [] }], noms: { lexique: [] }, personnages: [] };
    const b = verifierMonde('x', dossierTemporaire({ 'canon.json': canon, 'estimation.json': estimerCampagne(dm) }), dm, srd, { parcours: false });
    const revue = rubrique(b, 'Revue de secrets');
    expect(revue.statut).toBe('echec');
    expect(revue.details.some((d) => d.startsWith('FUITE') && d.includes(`« ${mot} »`))).toBe(true);
    expect(b.ok).toBe(false);
    expect(afficherBilan(b).join('\n')).toMatch(/❌ Pas prêt : .*Revue de secrets/);
  });

  it('un canon.json invalide est une erreur, pas un silence', () => {
    const b = verifierMonde('x', dossierTemporaire({ 'canon.json': { secrets: [{ id: 'sans-texte' }] } }), dm, srd, { parcours: false });
    expect(rubrique(b, 'Revue de secrets').statut).toBe('echec');
    expect(rubrique(b, 'Revue de secrets').resume).toMatch(/canon\.json invalide/);
  });

  it('un monde sans fin : le parcours n\'a rien à prouver (avis), un monde avec fins : il les joue', () => {
    const sansFin: DonneesMonde = { ...dm, fins: new Map() };
    expect(rubrique(verifierMonde('x', dossierTemporaire(), sansFin, srd), 'Parcours')).toMatchObject({ statut: 'avis', resume: expect.stringMatching(/aucune fin/) });
    const joue = verifierMonde('port-sillage', dossierEssai, dm, srd, { etats: 300, ms: 20_000 });
    expect(rubrique(joue, 'Parcours').resume).toMatch(/^\d+\/\d+ fins atteintes/);
  });
});

describe('pnpm monde verifier : la complétude et l\'affichage', () => {
  it('completudeDuMonde lit les fichiers du dossier (voix, images, estimation) comme `pnpm monde manque`', () => {
    const ecarts = completudeDuMonde(dossierTemporaire(), dm);
    // Dossier vide : ni manifeste, ni voix, ni estimation.
    expect(ecarts.some((e) => e.categorie === 'publication' && e.cible === 'estimation.json')).toBe(true);
  });

  it('le texte du bilan donne une ligne par rubrique et un verdict', () => {
    const b = verifierMonde('port-sillage', dossierEssai, dm, srd, { parcours: false });
    const texte = afficherBilan(b).join('\n');
    expect(texte).toContain('Vérification de port-sillage (publié)');
    for (const nom of ['Validation', 'Complétude', 'Estimation', 'Revue de secrets', 'Parcours']) expect(texte).toContain(nom);
    expect(texte).toMatch(/(✅ Rien ne bloque|❌ Pas prêt)/);
  });
});
