// Une défaite ne rapporte aucun butin : ni tables, ni dépouilles, ni réserve de l'ennemi ; la rencontre attend toujours, et ce que
// l'ennemi garde reste fermé tant qu'on ne l'a pas vaincu (retour de jeu du 15/11/2026 : « j'ai perdu un combat, mais je peux
// quand même ramasser le loot »).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bilanPersonnage, creerMoteur, groupeConseille, MODULES_STANDARD, personnageDepuisFiche, type DonneesMonde, type Partie } from '../src';
import { chargerMonde, RACINE_MONDES } from '../src/monde/chargeur';
import { chargerDonneesSrd } from '../src/donnees-node';

const srd = chargerDonneesSrd();
const r = chargerMonde(join(RACINE_MONDES, 'dime-des-roseaux'));
if (!r.ok) throw new Error(r.erreurs.map((e) => e.message).join('\n'));
const dm = r.monde as DonneesMonde;
const moteur = creerMoteur({ dm, srd }, MODULES_STANDARD);

const CAMP = 'min-r-le-camp-hobgobelin';
const CHARRETTE = 'min-t-la-charrette-saisie';
const GARDES = 'gro-r-gardes-de-la-grotte';
const CACHE_DU_GUET = 'gro-t-cache-du-guet';

/** Le groupe est dans le lieu de la rencontre, qui l'attend (scène de rencontre), avec 100 po en bourse. */
function enRencontre(rencontre: string): Partie {
  const g = groupeConseille(3, srd).emplacements.map((e) => {
    const f = bilanPersonnage(e!, srd).fiche!;
    return personnageDepuisFiche(f, { id: f.nom.toLowerCase() });
  });
  const p = moteur.executer(moteur.nouvellePartie(g, { graine: 7, niveau: 3 }), { type: 'commencer' }).partie;
  p.etat.lieu = dm.rencontres.get(rencontre)!.lieu!;
  p.etat.pieces = 100;
  p.scene = { type: 'rencontre', rencontre };
  return p;
}
const perdre = (p: Partie) => moteur.executer(p, { type: 'reglerRencontre', issue: 'defaite' });
const gagner = (p: Partie) => moteur.executer(p, { type: 'reglerRencontre', issue: 'victoire', px: 200 });

describe('défaite en combat d’histoire : pas de butin', () => {
  it('aucun gain : ni table, ni dépouilles, ni réserve ; l’or est coupé en deux, 8 h passent, la rencontre n’est pas faite', () => {
    const p = enRencontre(CAMP);
    const heure = p.etat.heure ?? 8;
    const inventaireAvant = JSON.stringify(p.etat.inventaire);
    const res = perdre(p);
    expect(res.refus).toBeUndefined();
    const q = res.partie;
    expect(JSON.stringify(q.etat.inventaire)).toBe(inventaireAvant);
    expect(q.etat.pieces).toBe(50);
    expect(q.etat.exploration.tresorsPris).toEqual([]);
    expect(q.etat.rencontresFaites).not.toContain(CAMP);
    expect(q.scene.type).toBe('exploration');
    expect(q.combatEnCours).toBeUndefined();
    expect(q.groupe.every((h) => h.pv >= 1)).toBe(true);
    expect(q.etat.heure).not.toBe(heure);
    const texte = JSON.stringify(res.evenements);
    expect(texte).not.toMatch(/Butin|Dépouilles|Dans /);
  });

  it('la charrette saisie, dans la cour du camp, reste gardée par le camp : on ne la prend pas après une défaite', () => {
    const q = perdre(enRencontre(CAMP)).partie;
    const essai = moteur.executer(q, { type: 'prendre', tresor: CHARRETTE });
    expect(essai.refus, 'la prise est refusée').toMatch(/gardé/);
    expect(essai.partie.etat.exploration.tresorsPris).not.toContain(CHARRETTE);
    const vue = moteur.vue<{ tresors: { id: string; etat: string }[] }>('scene', q);
    expect(vue.tresors.find((t) => t.id === CHARRETTE)?.etat).toBe('garde');
  });

  it('avant tout combat, une rencontre qui n’a pas eu lieu ne ferme rien', () => {
    const p = enRencontre(CAMP);
    p.scene = { type: 'exploration' };
    expect(moteur.executer(p, { type: 'prendre', tresor: CHARRETTE }).refus).toBeUndefined();
  });

  it('après la victoire, la charrette s’ouvre', () => {
    const q = gagner(enRencontre(CAMP)).partie;
    expect(q.etat.rencontresFaites).toContain(CAMP);
    const essai = moteur.executer(q, { type: 'prendre', tresor: CHARRETTE });
    expect(essai.refus).toBeUndefined();
  });

  it('la réserve de l’ennemi (butin.tresors) sans gardien déclaré reste fermée tant qu’il n’est pas vaincu, même découverte', () => {
    const p = enRencontre(GARDES);
    const q = perdre(p).partie;
    q.etat.exploration.decouverts.push(`tresor:${CACHE_DU_GUET}`);
    expect(moteur.executer(q, { type: 'prendre', tresor: CACHE_DU_GUET }).refus).toMatch(/gardé/);
    const vue = moteur.vue<{ tresors: { id: string; etat: string }[] }>('scene', q);
    expect(vue.tresors.find((t) => t.id === CACHE_DU_GUET)?.etat).toBe('garde');
  });

  it('la fuite ne rend pas la réserve non plus', () => {
    const p = enRencontre(GARDES);
    const q = moteur.executer(p, { type: 'reglerRencontre', issue: 'fuite' }).partie;
    q.etat.exploration.decouverts.push(`tresor:${CACHE_DU_GUET}`);
    expect(moteur.executer(q, { type: 'prendre', tresor: CACHE_DU_GUET }).refus).toMatch(/gardé/);
  });

  it('défaite, sauvegarde, rechargement : rien n’a changé', () => {
    const q = perdre(enRencontre(CAMP)).partie;
    const recharge = JSON.parse(JSON.stringify(q)) as Partie;
    expect(moteur.executer(recharge, { type: 'prendre', tresor: CHARRETTE }).refus).toMatch(/gardé/);
    expect(recharge.etat.rencontresFaites).not.toContain(CAMP);
  });

  it('la rencontre attend toujours : on peut la rejouer et la gagner, et le butin tombe alors une seule fois', () => {
    const q = perdre(enRencontre(CAMP)).partie;
    q.scene = { type: 'rencontre', rencontre: CAMP };
    const gagne = gagner(q).partie;
    expect(gagne.etat.rencontresFaites).toContain(CAMP);
    expect(gagne.etat.pieces).toBeGreaterThan(q.etat.pieces);
  });
});
