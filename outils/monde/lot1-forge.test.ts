// Lot 1, fiche C4 (docs/FICHES-LOT-1.md) : l'importateur de la Forge n'écrit plus de journal de quête qui nomme le lieu, et `calibrer`
// ne divise plus par zéro quand une estimation tombe à 0 h.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerDonneesSrd } from '../../packages/regles/src/donnees-node';
import type { Estimation } from '../../packages/regles/src/monde/estimation';
import { calibrer, texteCalibrage } from './calibrer';
import { ecrireMondeForge, inventaireAEcrire } from './importer-forge';

const SRD = chargerDonneesSrd();
const FIXTURE = join(import.meta.dirname, 'fixtures/villambrune.forge.json');
const MODELES = { dossier: join(import.meta.dirname, '../../.claude/skills/creer-monde/assets'), atlas: join(import.meta.dirname, '../../.claude/skills/decrire-lieux/assets/ATLAS.modele.md') };

type Etape = { id: string; texte: string; completion?: unknown };
type QueteForge = { id: string; etapes: Etape[] };
let resultat: ReturnType<typeof ecrireMondeForge>;
beforeAll(() => {
  const racine = mkdtempSync(join(tmpdir(), 'lot1-forge-'));
  resultat = ecrireMondeForge(racine, 'essai', FIXTURE, JSON.parse(readFileSync(FIXTURE, 'utf8')), MODELES, { profils: [...SRD.monstres.keys()], armes: [...SRD.armes.keys()] });
});
const etapes = (): Etape[] => (resultat.resultat.dossiers['quetes'] as QueteForge[]).flatMap((q) => q.etapes);
const etapesDeBut = () => etapes().filter((e) => /^(aller|vaincre|trouver|liberer|apporter)-/.test(e.id));

describe('G8 : les textes d’étape de l’importateur sont à écrire, sans nom de lieu', () => {
  it('aucune étape de but ne garde « Rendez-vous à… », « Vainquez… », « Trouvez… » ni « Apportez… »', () => {
    expect(etapesDeBut().length).toBeGreaterThan(3);
    for (const e of etapesDeBut()) expect(e.texte, e.id).toMatch(/^À écrire : ce que le joueur cherche/);
    expect(etapes().some((e) => /^(Rendez-vous|Vainquez|Trouvez|Libérez|Apportez)/.test(e.texte))).toBe(false);
  });

  it('la consigne d’une étape de déplacement dit de ne pas nommer le lieu', () => {
    const aller = etapesDeBut().find((e) => e.id.startsWith('aller-'))!;
    expect(aller.texte).toMatch(/ne nommez pas ce lieu/);
  });

  it('ces textes entrent dans l’inventaire du brief d’écriture, et le brief écrit sur disque', () => {
    const champs = inventaireAEcrire(resultat.resultat.dossiers, resultat.resultat.monde).filter((c) => c.dossier === 'quetes' && /etapes\[\d+\]\.texte$/.test(c.champ));
    expect(champs.length).toBeGreaterThanOrEqual(etapesDeBut().length);
    expect(readFileSync(join(resultat.dossier, 'BRIEF-ECRITURE.md'), 'utf8')).toMatch(/etapes\[\d+\]\.texte/);
  });

  it('le monde importé a toujours ses étapes et ses compléments : le plan n’a pas bougé', () => {
    for (const q of resultat.resultat.dossiers['quetes'] as QueteForge[]) {
      expect(q.etapes.length).toBeGreaterThan(0);
      for (const e of q.etapes) expect(e.completion, `${q.id}/${e.id}`).toBeDefined();
    }
  });
});

describe('S8 : `calibrer` ne rend plus Infinity', () => {
  const estimation = (total: number): Estimation => ({ monde: 'x', tours: 20, toursConteur: 8, heures: { recit: total, combats: 0, total }, couts: [], imagesUsd: 0, motsLus: 1000 });
  it('une estimation à 0 h donne un rapport fini et un texte lisible', () => {
    const r = calibrer(JSON.stringify({ version: 1, mesures: { x: { secondes: 3600, actions: 50, sessions: 1 } } }), new Map([['x', estimation(0)]]));
    expect(Number.isFinite(r.lignes[0]!.rapport)).toBe(true);
    expect(texteCalibrage(r)).not.toMatch(/Infinity|NaN/);
  });
});
