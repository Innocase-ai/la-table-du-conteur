// La Tombe des Rois Serpents : dix cinématiques de lieux (18/11/2026), une image du lieu + un texte court lu par le conteur,
// jouées à la première entrée dans le lieu. Le fichier est `scenes/cinematiques-lieux.json` ; les voix sont dans `voix/cine-<lieu>-1.mp3`.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const dossier = join(RACINE_MONDES, 'tombe-des-rois-serpents');
const r = chargerMonde(dossier);
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const LIEUX = [
  'bivouac-entree',
  'n1-faux-temple',
  'n1-porte-et-fausse-tombe',
  'n2-atrium',
  'n2-arene-gardien',
  'n3-hall-du-basilic',
  'n3-salle-invocation',
  'n3-salle-commune-gobeline',
  'n3-antichambre-xiximantre',
  'n3-salle-du-trone',
];
type SceneBrute = { id: string; nom: string; declencheur: { lieu?: string }; plans: { image: { groupe: string; id: string }; mouvement: string; texte: string }[] };
const scenes = ((dm.extensions?.['scenes'] ?? []) as SceneBrute[]).filter((s) => s.id.startsWith('cine-'));

describe('Cinématiques des lieux marquants de la Tombe', () => {
  it('dix scènes, une par lieu : un seul plan, l\'image du lieu, un texte court qui se lit à voix haute, une voix livrée', () => {
    expect(scenes.map((s) => s.declencheur.lieu)).toEqual(LIEUX);
    for (const s of scenes) {
      const lieu = s.declencheur.lieu!;
      expect(dm.lieux.has(lieu), lieu).toBe(true);
      expect(s.nom, s.id).toBe(dm.lieux.get(lieu)!.nom);
      expect(s.plans, s.id).toHaveLength(1);
      const plan = s.plans[0]!;
      expect(plan.image, s.id).toEqual({ groupe: 'lieux', id: lieu });
      const mots = plan.texte.split(/\s+/).length;
      expect(mots, `${s.id} : mots`).toBeGreaterThanOrEqual(38);
      expect(mots, `${s.id} : mots`).toBeLessThanOrEqual(60);
      expect(plan.texte, `${s.id} : forme pour l'oreille`).not.toMatch(/[();\d—–]/);
      expect(existsSync(join(dossier, 'voix', `${s.id}-1.mp3`)), `${s.id} : voix`).toBe(true);
    }
  });

  it('la cinématique se joue à la première entrée dans le lieu, pas à la seconde', () => {
    const g = groupeConseille(3, srd).emplacements.map((e) => {
      const f = bilanPersonnage(e!, srd).fiche!;
      return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
    });
    let p: Partie = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
    p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
    // La scène de remise de la quête attend déjà dans la file : on la passe, comme le joueur avant de quitter le Fort.
    p = moteur.executer(p, { type: 'terminerScene', scene: 'remise-quete' }).partie;
    p.etat.lieu = 'tombe-des-rois';
    p.etat.lieuxVisites.push('tombe-des-rois');
    const arrivee = moteur.executer(p, { type: 'aller', vers: 'bivouac-entree' });
    expect(arrivee.refus).toBeUndefined();
    expect(moteur.vue<{ id: string } | undefined>('sceneEnCours', arrivee.partie)?.id).toBe('cine-bivouac-entree');
    // Une fois vue, elle ne se rejoue pas (elle reste consultable dans le Journal).
    const vue = moteur.executer(arrivee.partie, { type: 'terminerScene', scene: 'cine-bivouac-entree' }).partie;
    vue.etat.lieu = 'tombe-des-rois';
    const retour = moteur.executer(vue, { type: 'aller', vers: 'bivouac-entree' });
    expect(moteur.vue<{ id: string } | undefined>('sceneEnCours', retour.partie)?.id).not.toBe('cine-bivouac-entree');
  });
});
