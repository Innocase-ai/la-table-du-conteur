// La Tombe des Rois Serpents : cinq personnages du Fort parlent sur trois tons selon leur attitude envers le groupe (18/11/2026).
// Le ton NEUTRE est la réponse de base du sujet ; AMICAL (attitude ≥ 30) et HOSTILE (attitude ≤ −30, les seuils du moteur) sont des
// variantes écrites pour le même sujet. Les trois versions donnent la même information : seuls la manière et le geste changent.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'tombe-des-rois-serpents'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

/** Personnage, sujet, et ce qui doit se retrouver dans les trois tons (l'information du sujet). */
/** `hostile: false` : le sujet n'est pas ouvert à un PNJ hostile (la parole elle-même est refusée), il n'a donc pas de variante hostile. */
const CAS: { pnj: string; sujet: string; informations: RegExp[]; hostile?: boolean }[] = [
  { pnj: 'commandeur-garin', sujet: 'contrat-et-piste', informations: [/Aldéric/, /moitié/, /Martin/, /Bivouac du Seuil/, /huit heures/, /deux mules/, /ne lui promettez que ce que vous tiendrez/i] },
  { pnj: 'marta-aubergiste', sujet: 'rescapes-du-fort', informations: [/Varnac/, /Lysandre/, /Mireille/, /chapelle/, /scriptorium/, /Marta qui vous envoie/] },
  { pnj: 'varnac-le-borgne', sujet: 'avis-sur-le-groupe', informations: [/couvercle/, /dalle/, /recule/], hostile: false },
  { pnj: 'mireille-cartographe', sujet: 'plan-et-mecanismes', informations: [/contrepoids d'eau/, /socles pivotants/, /bicolores/, /la plus usée/, /pierre claire est polie/] },
  { pnj: 'corvin-le-scribe', sujet: 'clauses-contrat', informations: [/Paragraphe quatre/, /Moitié exacte/, /Martin/, /cent pièces/, /immunité/, /pas d'autre clause/] },
];

function auFort(): Partie {
  const g = groupeConseille(3, srd).emplacements.map((e) => {
    const f = bilanPersonnage(e!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  let p = moteur.executer(moteur.nouvellePartie(g, { graine: 11, niveau: 3 }), { type: 'commencer' }).partie;
  p = moteur.executer(p, { type: 'terminerScene', scene: 'ouverture' }).partie;
  return moteur.executer(p, { type: 'terminerScene', scene: 'remise-quete' }).partie;
}

/** Ce que dit le personnage sur ce sujet, le groupe étant dans son lieu et son attitude réglée. */
function reponse(pnj: string, sujet: string, attitude: number): string {
  let p = auFort();
  p.etat.lieu = dm.pnj.get(pnj)!.lieu;
  p.etat.attitudes[pnj] = attitude;
  p = moteur.executer(p, { type: 'parler', pnj }).partie;
  p.etat.attitudes[pnj] = attitude; // la salutation ne doit pas avoir changé le ton : on le refixe, par prudence
  const res = moteur.executer(p, { type: 'parler', pnj, sujet });
  expect(res.refus, `${pnj} / ${sujet} à l'attitude ${attitude}`).toBeUndefined();
  const t = res.evenements.find((e) => e.type === 'texte') as { texte: string } | undefined;
  expect(t, `${pnj} / ${sujet} : aucune réplique`).toBeDefined();
  return t!.texte;
}

describe('Registres de parole du Fort : trois tons selon l\'attitude', () => {
  for (const { pnj, sujet, informations, hostile: aHostile = true } of CAS) {
    describe(`${pnj} · ${sujet}`, () => {
      const s = dm.pnj.get(pnj)!.sujets.find((x) => x.id === sujet)!;
      it('a deux variantes, amicale (≥ 30) et hostile (≤ −30), distinctes de la réponse de base', () => {
        expect(s.variantes).toHaveLength(aHostile ? 2 : 1);
        const [amicale, hostile] = s.variantes;
        expect(amicale!.condition).toEqual({ pnj: { id: pnj, attitudeMin: 30 } });
        if (hostile) expect(hostile.condition).toEqual({ pnj: { id: pnj, attitudeMax: -30 } });
        expect(new Set(s.variantes.map((v) => v.reponse).concat(s.reponse)).size).toBe(s.variantes.length + 1);
      });

      it('le ton suit l\'attitude : hostile, neutre (la réponse de base), amical', () => {
        if (aHostile) expect(reponse(pnj, sujet, -40)).toBe(s.variantes[1]!.reponse);
        else {
          // Un PNJ hostile ne parle pas de ce sujet du tout : sa variante hostile serait un texte que personne ne lirait.
          let p = auFort();
          p.etat.lieu = dm.pnj.get(pnj)!.lieu;
          p.etat.attitudes[pnj] = -40;
          p = moteur.executer(p, { type: 'parler', pnj }).partie;
          expect(moteur.executer(p, { type: 'parler', pnj, sujet }).refus).toBeDefined();
        }
        if (aHostile) expect(reponse(pnj, sujet, 0)).toBe(s.reponse);
        expect(reponse(pnj, sujet, 40)).toBe(s.variantes[0]!.reponse);
        // Les degrés intermédiaires (méfiant, bienveillant) gardent le ton neutre.
        if (aHostile) expect(reponse(pnj, sujet, -20)).toBe(s.reponse);
        expect(reponse(pnj, sujet, 25)).toBe(s.reponse);
      });

      it('les trois tons donnent la même information', () => {
        for (const texte of [s.reponse, ...s.variantes.map((v) => v.reponse)]) for (const info of informations) expect(texte, String(info)).toMatch(new RegExp(info.source, 'i'));
      });

      it('les variantes font entre 60 et 115 mots, sans mécanique de jeu', () => {
        for (const v of s.variantes) {
          const mots = v.reponse.split(/\s+/).length;
          expect(mots).toBeGreaterThanOrEqual(60);
          expect(mots).toBeLessThanOrEqual(115);
          expect(v.reponse).not.toMatch(/\b(jet|DD|PV|niveau|attitude|jauge)\b/i);
        }
      });
    });
  }
});
